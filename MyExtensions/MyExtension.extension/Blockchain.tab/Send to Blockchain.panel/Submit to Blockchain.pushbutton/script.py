# script.py — Revit-2026-ready, model-agnostic 🌍
# -*- coding: utf-8 -*-

"""
Extract element volumes, classify materials (Concrete, Steel, CLT), calculate
stage-based embodied carbon (A1-A3, A4, A5), dump results to JSON, and launch
an external Web3 uploader.

Updated to work with EmbodiedCarbonLedgerV2 smart contract.
"""

import sys, os, json, subprocess, time
from Autodesk.Revit.DB import (
    FilteredElementCollector,
    BuiltInCategory,
    BuiltInParameter,
    StorageType,
)

# ──────────────────────────────────────────────────────────────────────────
# constants
# ──────────────────────────────────────────────────────────────────────────
FT3_TO_M3 = 0.0283168466       # Revit internal length = imperial feet

DEFAULT_DENSITIES = {          # kg / m³ (fallback if no asset density)
    "Concrete": 2400,
    "Steel":    7850,
    "CLT":      500,
}

# Material enum mapping for smart contract (Concrete=0, CLT=1, Steel=2)
MATERIAL_ENUM = {
    "Concrete": 0,
    "CLT": 1,
    "Steel": 2,
}

KEYWORD_MAP = {                # lowercase search → canonical bucket
    "concrete":                  "Concrete",
    "cast-in-place":             "Concrete",
    "steel":                     "Steel",
    "clt":                       "CLT",
    "cross laminated timber":    "CLT",
    "cross-laminated timber":    "CLT",
    "cross laminated":           "CLT",
    "cross-laminated":           "CLT",
    "timber":                    "CLT",
    "wood":                      "CLT",
    "lumber":                    "CLT",
}

# ──────────────────────────────────────────────────────────────────────────
# helpers
# ──────────────────────────────────────────────────────────────────────────
def get_element_id_value(element_id):
    """
    Get integer value from ElementId - compatible with different Revit versions.
    Returns a regular int (not long) for JSON serialization.
    """
    try:
        # Revit 2024+ uses .Value
        value = element_id.Value
    except AttributeError:
        try:
            # Older Revit versions use .IntegerValue
            value = element_id.IntegerValue
        except AttributeError:
            # Fallback: convert to string then to int
            value = int(str(element_id))
    
    # Ensure it's a regular int, not long (for JSON serialization)
    return int(value)


def get_volume_m3(elem):
    """
    Return solid volume in m³ for *any* element.

    Works across Revit versions because the built-in parameters are collected
    at runtime; if a parameter is not defined in the API DLL, it is skipped.
    """
    param_names = (
        "HOST_VOLUME_COMPUTED",     # most host objects
        "HOST_VOLUME_SCHEDULED",    # new in 2025+
        "VOLUME",                   # many family categories
        "SOLID_VOLUME",             # generic fallback
    )
    param_bips = [
        getattr(BuiltInParameter, n, None) for n in param_names
        if hasattr(BuiltInParameter, n)
    ]

    for bip in param_bips:
        try:
            p = elem.get_Parameter(bip)
            if (
                p
                and p.StorageType == StorageType.Double
                and p.AsDouble() > 0
            ):
                return p.AsDouble() * FT3_TO_M3
        except Exception:
            pass  # keep trying the next candidate

    # last-chance: name-based lookup (families exposing "Volume")
    p = elem.LookupParameter("Volume")
    if p and p.HasValue:
        return p.AsDouble() * FT3_TO_M3

    return 0.0


def enum_material_ids(doc, elem):
    """
    Return a set of all MaterialIds referenced by the element:
      • Instance material IDs
      • Type material IDs
      • Structural Material on instance and type
      • Compound structure layers (for roofs, walls, floors)
    """
    ids = set()
    
    # Get materials from element
    ids.update(elem.GetMaterialIds(False))

    # Get materials from type
    typ = doc.GetElement(elem.GetTypeId())
    if typ:
        ids.update(typ.GetMaterialIds(False))
        
        # For host objects, check compound structure
        try:
            cs = typ.GetCompoundStructure()
            if cs:
                for i in range(cs.LayerCount):
                    mat_id = cs.GetMaterialId(i)
                    if mat_id and mat_id.IntegerValue != -1:
                        ids.add(mat_id)
        except Exception:
            pass

    # Check structural material parameter
    for owner in (elem, typ):
        if not owner:
            continue
        try:
            p = owner.get_Parameter(BuiltInParameter.STRUCTURAL_MATERIAL_PARAM)
            if p and p.HasValue:
                ids.add(p.AsElementId())
        except Exception:
            pass

    return ids


def physical_density_kg_m3(mat):
    """Return density from the Structural Asset if present, else None."""
    try:
        sa = mat.GetStructuralAsset()
        if sa and sa.Density > 0:
            return sa.Density
    except Exception:
        pass
    return None


def classify_material(mat):
    """
    Map a Revit Material → ('Concrete' | 'Steel' | 'CLT' | 'Other', ρ),
    where ρ is the material density or None.
    """
    if not mat:
        return "Other", None
        
    # Debug print to see what materials we're finding
    print("  Checking material: '{}'".format(mat.Name))
    
    # 1) Check material name first (more reliable for custom materials)
    name_lc = mat.Name.lower()
    for kw, bucket in KEYWORD_MAP.items():
        if kw in name_lc:
            print("    -> Matched '{}' keyword, classifying as {}".format(kw, bucket))
            return bucket, physical_density_kg_m3(mat)
    
    # 2) Then check MaterialClass
    if mat.MaterialClass:
        cls = mat.MaterialClass.lower()
        print("    MaterialClass: '{}'".format(mat.MaterialClass))
        
        if cls in ("concrete", "steel"):
            print("    -> Matched MaterialClass, classifying as {}".format(cls.title()))
            return cls.title(), physical_density_kg_m3(mat)
            
        # Check for wood/timber in MaterialClass
        if any(word in cls for word in ["timber", "wood", "lumber"]):
            print("    -> Matched wood/timber in MaterialClass, classifying as CLT")
            return "CLT", physical_density_kg_m3(mat)

    print("    -> No match, classifying as Other")
    return "Other", None


def generate_project_id():
    """Generate a project ID based on current document name and timestamp."""
    doc = __revit__.ActiveUIDocument.Document
    doc_title = doc.Title or "Unknown_Project"
    timestamp = str(int(time.time()))
    return "{}_{}".format(doc_title.replace(" ", "_"), timestamp)


# ──────────────────────────────────────────────────────────────────────────
def main():
    doc = __revit__.ActiveUIDocument.Document

    TARGET_CATS = [
        BuiltInCategory.OST_StructuralFraming,
        BuiltInCategory.OST_StructuralColumns,
        BuiltInCategory.OST_StructuralFoundation,
        BuiltInCategory.OST_Floors,
        BuiltInCategory.OST_Walls,
        BuiltInCategory.OST_Roofs,
    ]

    vols   = {"Concrete": 0.0, "Steel": 0.0, "CLT": 0.0}
    masses = {"Concrete": 0.0, "Steel": 0.0, "CLT": 0.0}
    unknowns = {}      # {ElemId: Element.Name}
    
    # Track individual material records for smart contract
    material_records = []
    
    # Debug counter
    element_count = {"Concrete": 0, "Steel": 0, "CLT": 0}

    # Generate project ID
    project_id = generate_project_id()
    print("Project ID: {}".format(project_id))

    # ── element walk-through ───────────────────────────────────────────
    for cat in TARGET_CATS:
        collector = FilteredElementCollector(doc).OfCategory(cat).WhereElementIsNotElementType()
        elements = list(collector.ToElements())
        
        if elements:
            cat_name = str(cat).replace("OST_", "")
            print("\n=== Processing {} {} ===".format(len(elements), cat_name))
        
        for e in elements:
            v_m3 = get_volume_m3(e)
            if v_m3 == 0.0:
                continue
                
            print("\nElement: {} (Id: {})".format(e.Name, e.Id))
            print("  Volume: {:.2f} m³".format(v_m3))

            # ── choose the best bucket for this element ────────────────
            chosen_bucket, chosen_rho = None, None
            materials_found = []

            for mid in enum_material_ids(doc, e):
                mat = doc.GetElement(mid)
                if not mat:
                    continue
                    
                bucket, rho = classify_material(mat)
                materials_found.append((mat.Name, bucket))

                # priority: 1) CLT  2) Steel  3) Concrete
                if bucket == "CLT":
                    chosen_bucket, chosen_rho = "CLT", rho
                    break                          # top priority found
                elif bucket == "Steel" and chosen_bucket != "CLT":
                    chosen_bucket, chosen_rho = "Steel", rho
                elif bucket == "Concrete" and chosen_bucket is None:
                    chosen_bucket, chosen_rho = "Concrete", rho

            print("  Materials found: {}".format(materials_found))
            print("  Chosen bucket: {}".format(chosen_bucket))

            # no recognised material → log and next element
            if chosen_bucket is None:
                unknowns[get_element_id_value(e.Id)] = e.Name
                continue

            chosen_rho = chosen_rho or DEFAULT_DENSITIES[chosen_bucket]
            vols[chosen_bucket]   += v_m3
            masses[chosen_bucket] += v_m3 * chosen_rho
            element_count[chosen_bucket] += 1
            
            # Add individual record for smart contract (volume scaled by 1e6)
            material_records.append({
                "material": chosen_bucket,
                "material_enum": MATERIAL_ENUM[chosen_bucket],
                "volume_m3": v_m3,
                "scaled_volume": int(v_m3 * 1e6),  # Contract expects uint256 scaled by 1e6
                "element_id": get_element_id_value(e.Id),
                "element_name": e.Name,
                "category": str(doc.GetElement(e.GetTypeId()).Category.Name) if e.GetTypeId() else "Unknown"
            })

    # Print summary
    print("\n=== SUMMARY ===")
    for m in ("Concrete", "Steel", "CLT"):
        print("{}: {} elements, {:.2f} m³, {:.0f} kg".format(
            m, element_count[m], vols[m], masses[m]
        ))
    if unknowns:
        print("Unclassified: {} elements".format(len(unknowns)))

    # ── embodied-carbon factors (kg CO₂e / kg) ─────────────────────────
    FACTOR = {
        "Concrete": (0.120, 0.005, 0.008),
        "Steel":    (2.450, 0.032, 0.250),
        "CLT":      (0.437, 0.160, 0.007),
    }

    results, grand = {}, 0.0
    for m in ("Concrete", "Steel", "CLT"):
        A1A3 = masses[m] * FACTOR[m][0] / 1000.0   # → t CO₂e
        A4   = masses[m] * FACTOR[m][1] / 1000.0
        A5   = masses[m] * FACTOR[m][2] / 1000.0
        tot  = A1A3 + A4 + A5
        results[m] = dict(
            volume_m3 = vols[m],
            mass_kg   = masses[m],
            A1A3      = A1A3,
            A4        = A4,
            A5        = A5,
            total     = tot,
            element_count = element_count[m]
        )
        grand += tot

    results["grand_total"]           = grand
    results["unclassified_elements"] = unknowns
    results["project_id"]            = project_id
    results["material_records"]      = material_records
    results["timestamp"]             = int(time.time())

    # ensure output folder exists
    out_path = r"C:\temp\emissions.json"
    out_dir  = os.path.dirname(out_path)
    if not os.path.isdir(out_dir):
        os.makedirs(out_dir)

    with open(out_path, "w") as fp:
        json.dump(results, fp, indent=2)
    print(u"\n✅  Saved JSON →", out_path)

    # launch external uploader
    try:
        subprocess.Popen([
            r"C:\Users\istiq\AppData\Local\Programs\Python\Python313\python.exe",
            r"C:\scripts\my_web3_script.py",
            out_path,
        ])
        print(u"🚀  External Web3 script started.")
    except Exception as exc:
        print(u"🚨  Couldn't launch Web3 script:", exc)


if __name__ == "__main__":
    main()
    raw_input("Done — press Enter to close…")