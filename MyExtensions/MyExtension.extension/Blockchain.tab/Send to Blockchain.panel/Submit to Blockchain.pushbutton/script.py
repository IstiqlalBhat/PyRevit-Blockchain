# script.py
# -*- coding: utf-8 -*-

"""
Extract element volumes, classify materials, calculate embodied carbon,
dump results to JSON, and launch external Web3 uploader.
"""

import sys
import os
import json
import subprocess
import time
import hashlib
import stat

from Autodesk.Revit.DB import (
    FilteredElementCollector,
    BuiltInCategory,
    BuiltInParameter,
    StorageType,
)

# Project root directory
PROJECT_ROOT = r"C:\Users\istiq\Downloads\PyRevit-Blockchain-main"

class ConfigLoader(object):
    DEFAULTS = {
        "paths": {
            "project_root": PROJECT_ROOT,
            "emissions_output": os.path.join(PROJECT_ROOT, "output", "emissions.json"),
            "python_executable": r"C:\Users\istiq\AppData\Local\Programs\Python\Python313\python.exe",
            "web3_script": os.path.join(PROJECT_ROOT, "scripts", "my_web3_script.py"),
            "contract_abi": "contract_abi.json"
        },
        "security": {
            "enable_data_integrity_check": True,
            "hash_algorithm": "sha256",
            "protect_emissions_file": True
        }
    }
    
    def __init__(self):
        self._config = None
        self._load_config()
    
    def _find_config_file(self):
        search_paths = [
            os.path.join(PROJECT_ROOT, "scripts", "config.json"),
            os.path.join(os.path.dirname(__file__), "config.json"),
        ]
        for path in search_paths:
            if os.path.exists(path):
                return path
        return None
    
    def _load_config(self):
        config_path = self._find_config_file()
        if config_path:
            try:
                with open(config_path, 'r') as f:
                    self._config = json.load(f)
                print("Loaded config from: {}".format(config_path))
            except Exception as e:
                print("Could not load config.json: {}".format(e))
                self._config = self.DEFAULTS
        else:
            print("No config.json found, using defaults.")
            self._config = self.DEFAULTS
    
    def get(self, *keys, **kwargs):
        default = kwargs.get('default', None)
        obj = self._config
        for key in keys:
            if isinstance(obj, dict) and key in obj:
                obj = obj[key]
            else:
                return default
        return obj
    
    @property
    def emissions_output_path(self):
        return self.get('paths', 'emissions_output', default=self.DEFAULTS['paths']['emissions_output'])
    
    @property
    def python_executable(self):
        return self.get('paths', 'python_executable', default=self.DEFAULTS['paths']['python_executable'])
    
    @property
    def web3_script_path(self):
        return self.get('paths', 'web3_script', default=self.DEFAULTS['paths']['web3_script'])
    
    @property
    def enable_integrity_check(self):
        return self.get('security', 'enable_data_integrity_check', default=True)
    
    @property
    def protect_emissions_file(self):
        return self.get('security', 'protect_emissions_file', default=True)

CONFIG = ConfigLoader()

FT3_TO_M3 = 0.0283168466
DEFAULT_DENSITIES = {"Concrete": 2400, "Steel": 7850, "CLT": 500}
MATERIAL_ENUM = {"Concrete": 0, "CLT": 1, "Steel": 2}
KEYWORD_MAP = {
    "concrete": "Concrete", "cast-in-place": "Concrete", "steel": "Steel",
    "clt": "CLT", "cross laminated timber": "CLT", "cross-laminated timber": "CLT",
    "cross laminated": "CLT", "cross-laminated": "CLT", "timber": "CLT",
    "wood": "CLT", "lumber": "CLT"
}

def get_element_id_value(element_id):
    try:
        return int(element_id.Value)
    except AttributeError:
        try:
            return int(element_id.IntegerValue)
        except AttributeError:
            return int(str(element_id))

def normalize_for_hash(obj):
    if isinstance(obj, dict):
        return {k: normalize_for_hash(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [normalize_for_hash(item) for item in obj]
    elif isinstance(obj, float):
        return round(obj, 6)
    else:
        return obj

def compute_data_hash(data):
    try:
        normalized = normalize_for_hash(data)
        canonical = json.dumps(normalized, sort_keys=True, separators=(',', ':'))
        return hashlib.sha256(canonical.encode('utf-8')).hexdigest()
    except Exception as e:
        print("Hash computation failed: {}".format(e))
        return "hash_error"

def make_file_readonly(filepath):
    try:
        # Use standard S_IREAD for Windows compatibility
        os.chmod(filepath, stat.S_IREAD)
        return True
    except Exception as e:
        print("Could not set file as read-only: {}".format(e))
        return False

def make_file_writable(filepath):
    try:
        if os.path.exists(filepath):
            # Enable write permission
            os.chmod(filepath, stat.S_IWRITE)
        return True
    except Exception as e:
        print("Could not make file writable: {}".format(e))
        return False

def get_volume_m3(elem):
    param_names = ("HOST_VOLUME_COMPUTED", "HOST_VOLUME_SCHEDULED", "VOLUME", "SOLID_VOLUME")
    param_bips = [getattr(BuiltInParameter, n, None) for n in param_names if hasattr(BuiltInParameter, n)]
    
    for bip in param_bips:
        try:
            p = elem.get_Parameter(bip)
            if p and p.StorageType == StorageType.Double and p.AsDouble() > 0:
                return p.AsDouble() * FT3_TO_M3
        except Exception:
            pass
            
    p = elem.LookupParameter("Volume")
    if p and p.HasValue:
        return p.AsDouble() * FT3_TO_M3
    return 0.0

def enum_material_ids(doc, elem):
    ids = set()
    ids.update(elem.GetMaterialIds(False))
    typ = doc.GetElement(elem.GetTypeId())
    if typ:
        ids.update(typ.GetMaterialIds(False))
        try:
            cs = typ.GetCompoundStructure()
            if cs:
                for i in range(cs.LayerCount):
                    mat_id = cs.GetMaterialId(i)
                    if mat_id and mat_id.IntegerValue != -1:
                        ids.add(mat_id)
        except Exception:
            pass
    for owner in (elem, typ):
        if not owner: continue
        try:
            p = owner.get_Parameter(BuiltInParameter.STRUCTURAL_MATERIAL_PARAM)
            if p and p.HasValue:
                ids.add(p.AsElementId())
        except Exception:
            pass
    return ids

def physical_density_kg_m3(mat):
    try:
        sa = mat.GetStructuralAsset()
        if sa and sa.Density > 0: return sa.Density
    except Exception:
        pass
    return None

def classify_material(mat):
    if not mat: return "Other", None
    print("  Checking material: '{}'".format(mat.Name))
    name_lc = mat.Name.lower()
    for kw, bucket in KEYWORD_MAP.items():
        if kw in name_lc:
            return bucket, physical_density_kg_m3(mat)
    if mat.MaterialClass:
        cls = mat.MaterialClass.lower()
        if cls in ("concrete", "steel"):
            return cls.title(), physical_density_kg_m3(mat)
        if any(word in cls for word in ["timber", "wood", "lumber"]):
            return "CLT", physical_density_kg_m3(mat)
    return "Other", None

def generate_project_id():
    doc = __revit__.ActiveUIDocument.Document
    doc_title = doc.Title or "Unknown_Project"
    timestamp = str(int(time.time()))
    return "{}_{}".format(doc_title.replace(" ", "_"), timestamp)

def main():
    doc = __revit__.ActiveUIDocument.Document
    TARGET_CATS = [
        BuiltInCategory.OST_StructuralFraming, BuiltInCategory.OST_StructuralColumns,
        BuiltInCategory.OST_StructuralFoundation, BuiltInCategory.OST_Floors,
        BuiltInCategory.OST_Walls, BuiltInCategory.OST_Roofs
    ]
    
    vols = {"Concrete": 0.0, "Steel": 0.0, "CLT": 0.0}
    masses = {"Concrete": 0.0, "Steel": 0.0, "CLT": 0.0}
    unknowns = {}
    material_records = []
    element_count = {"Concrete": 0, "Steel": 0, "CLT": 0}
    
    project_id = generate_project_id()
    print("Project ID: {}".format(project_id))
    
    for cat in TARGET_CATS:
        collector = FilteredElementCollector(doc).OfCategory(cat).WhereElementIsNotElementType()
        elements = list(collector.ToElements())
        if elements:
            print("\n=== Processing {} ===".format(str(cat)))
            
        for e in elements:
            v_m3 = get_volume_m3(e)
            if v_m3 == 0.0: continue
            
            print("\nElement: {} (Id: {})".format(e.Name, e.Id))
            print("  Volume: {:.2f} m3".format(v_m3))
            
            chosen_bucket, chosen_rho = None, None
            for mid in enum_material_ids(doc, e):
                mat = doc.GetElement(mid)
                if not mat: continue
                bucket, rho = classify_material(mat)
                if bucket == "CLT":
                    chosen_bucket, chosen_rho = "CLT", rho
                    break
                elif bucket == "Steel" and chosen_bucket != "CLT":
                    chosen_bucket, chosen_rho = "Steel", rho
                elif bucket == "Concrete" and chosen_bucket is None:
                    chosen_bucket, chosen_rho = "Concrete", rho
            
            if chosen_bucket is None:
                unknowns[get_element_id_value(e.Id)] = e.Name
                continue
                
            chosen_rho = chosen_rho or DEFAULT_DENSITIES[chosen_bucket]
            vols[chosen_bucket] += v_m3
            masses[chosen_bucket] += v_m3 * chosen_rho
            element_count[chosen_bucket] += 1
            
            material_records.append({
                "material": chosen_bucket,
                "material_enum": MATERIAL_ENUM[chosen_bucket],
                "volume_m3": v_m3,
                "scaled_volume": int(v_m3 * 1e6),
                "element_id": get_element_id_value(e.Id),
                "element_name": e.Name,
                "category": str(doc.GetElement(e.GetTypeId()).Category.Name) if e.GetTypeId() else "Unknown"
            })

    print("\n=== SUMMARY ===")
    for m in ("Concrete", "Steel", "CLT"):
        print("{}: {} elements, {:.2f} m3, {:.0f} kg".format(m, element_count[m], vols[m], masses[m]))
    
    FACTOR = {
        "Concrete": (0.120, 0.005, 0.008),
        "Steel": (2.450, 0.032, 0.250),
        "CLT": (0.437, 0.160, 0.007),
    }
    
    results, grand = {}, 0.0
    for m in ("Concrete", "Steel", "CLT"):
        A1A3 = masses[m] * FACTOR[m][0] / 1000.0
        A4 = masses[m] * FACTOR[m][1] / 1000.0
        A5 = masses[m] * FACTOR[m][2] / 1000.0
        tot = A1A3 + A4 + A5
        results[m] = dict(
            volume_m3=vols[m], mass_kg=masses[m],
            A1A3=A1A3, A4=A4, A5=A5, total=tot,
            element_count=element_count[m]
        )
        grand += tot
        
    results["grand_total"] = grand
    results["unclassified_elements"] = unknowns
    results["project_id"] = project_id
    results["material_records"] = material_records
    results["timestamp"] = int(time.time())
    
    if CONFIG.enable_integrity_check:
        data_hash = compute_data_hash(results)
        results["_data_hash"] = data_hash
        print("\nData integrity hash: {}".format(data_hash[:16] + "..."))
        
    out_path = CONFIG.emissions_output_path
    out_dir = os.path.dirname(out_path)
    if not os.path.isdir(out_dir):
        os.makedirs(out_dir)
        
    if os.path.exists(out_path):
        make_file_writable(out_path)
        
    with open(out_path, "w") as fp:
        json.dump(results, fp, indent=2)
    print("\nSaved JSON to: {}".format(out_path))
    
    if CONFIG.protect_emissions_file:
        make_file_readonly(out_path)
        
    try:
        python_exe = CONFIG.python_executable
        web3_script = CONFIG.web3_script_path
        print("\nLaunching Web3 script...")
        print("Python: {}".format(python_exe))
        print("Script: {}".format(web3_script))
        
        subprocess.Popen([python_exe, web3_script, out_path])
        print("External Web3 script started.")
    except Exception as exc:
        print("Could not launch Web3 script: {}".format(exc))

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("An error occurred: {}".format(e))
        import traceback
        traceback.print_exc()
    raw_input("Press Enter to close...")
