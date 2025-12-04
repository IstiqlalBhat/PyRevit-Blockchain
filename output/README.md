# Output Directory

This directory contains emission data exported from Revit.

## Security

- **emissions.json** files are automatically made **read-only** after export to prevent tampering
- Files include a SHA256 integrity hash that is verified before blockchain upload
- If you need to re-export, Revit will automatically handle the read-only attribute

## Files

| File | Description |
|------|-------------|
| `emissions.json` | Latest emission data export from Revit |

## Important

- Do NOT manually edit `emissions.json` files
- The integrity hash will detect any modifications
- The Web3 upload script will warn if tampering is detected

## Troubleshooting

If you get a "permission denied" error:
1. The file might be read-only (this is intentional protection)
2. Re-export from Revit - it will handle permissions automatically
3. Or manually remove read-only: `attrib -r emissions.json` (not recommended)

