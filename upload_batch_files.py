#!/usr/bin/env python3
"""
Script untuk mengupload file batch ke setiap folder di data/public
Membuat file JSON template untuk folder yang belum memiliki file
"""

import os
import json
import shutil
from pathlib import Path

def create_template_bangunan(folder_name):
    """Membuat template file Bangunan.json"""
    template = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [98.5, 3.6, 0]
                },
                "properties": {
                    "id_di": "0000",
                    "k_di": folder_name,
                    "n_di": f"Template {folder_name}",
                    "nama": "Template Bangunan",
                    "nomenklatu": "TEMP.1",
                    "k_aset": "T01",
                    "n_aset": "Template",
                    "panjang_sa": "",
                    "luas_layan": "",
                    "norec": "1",
                    "profil": "",
                    "panjang": "",
                    "norec_salu": "1",
                    "saluran": "Template Saluran"
                }
            }
        ]
    }
    return template

def create_template_fungsional(folder_name):
    """Membuat template file Fungsional.json"""
    template = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[98.5, 3.6], [98.51, 3.6], [98.51, 3.61], [98.5, 3.61], [98.5, 3.6]]]
                },
                "properties": {
                    "NAMA_DI": f"TEMPLATE {folder_name}",
                    "LUAS_HA": 0.01,
                    "Thn_Dat": "2024",
                    "Kondisi": "TEMPLATE",
                    "Kecamatan": "TEMPLATE",
                    "Desa_Kel": "TEMPLATE",
                    "Smb_Air": "TEMPLATE",
                    "Keterangan": "Template Data",
                    "DESA": "",
                    "SMBR_AIR": "TEMPLATE",
                    "PANJANG_SP": 0,
                    "PANJANG_SS": 0
                }
            }
        ]
    }
    return template

def create_template_saluran(folder_name):
    """Membuat template file Saluran.json"""
    template = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [[98.5, 3.6], [98.51, 3.61]]
                },
                "properties": {
                    "id_di": "0000",
                    "k_di": folder_name,
                    "n_di": f"Template {folder_name}",
                    "nama": "Template Saluran",
                    "nomenklatu": "TS.1",
                    "k_aset": "S01",
                    "n_aset": "Template Saluran",
                    "panjang_sa": "100.0",
                    "luas_layan": "0",
                    "norec": "1",
                    "profil": "",
                    "panjang": "",
                    "norec_salu": "",
                    "saluran": ""
                }
            }
        ]
    }
    return template

def copy_existing_files(source_folder, target_folder):
    """Menyalin file yang sudah ada dari folder source ke target"""
    source_path = Path(source_folder)
    target_path = Path(target_folder)
    
    if not source_path.exists():
        return False
    
    # Cari file JSON yang ada
    json_files = list(source_path.glob("*.json"))
    
    for json_file in json_files:
        target_file = target_path / json_file.name
        shutil.copy2(json_file, target_file)
        print(f"  ✓ Disalin: {json_file.name}")
    
    return len(json_files) > 0

def create_batch_files_for_folder(folder_path):
    """Membuat file batch untuk folder tertentu"""
    folder_name = folder_path.name
    print(f"\n📁 Memproses folder: {folder_name}")
    
    # Cek apakah folder sudah memiliki file
    existing_files = list(folder_path.glob("*.json"))
    
    if existing_files:
        print(f"  ℹ️  Folder sudah memiliki {len(existing_files)} file JSON")
        for file in existing_files:
            print(f"    - {file.name}")
        return
    
    # Buat file template jika folder kosong
    print(f"  📝 Membuat file template untuk folder kosong...")
    
    # Buat file Bangunan
    bangunan_file = folder_path / f"{folder_name}_Bangunan.json"
    with open(bangunan_file, 'w', encoding='utf-8') as f:
        json.dump(create_template_bangunan(folder_name), f, indent=2, ensure_ascii=False)
    print(f"  ✓ Dibuat: {bangunan_file.name}")
    
    # Buat file Fungsional
    fungsional_file = folder_path / f"{folder_name}_Fungsional.json"
    with open(fungsional_file, 'w', encoding='utf-8') as f:
        json.dump(create_template_fungsional(folder_name), f, indent=2, ensure_ascii=False)
    print(f"  ✓ Dibuat: {fungsional_file.name}")
    
    # Buat file Saluran
    saluran_file = folder_path / f"{folder_name}_Saluran.json"
    with open(saluran_file, 'w', encoding='utf-8') as f:
        json.dump(create_template_saluran(folder_name), f, indent=2, ensure_ascii=False)
    print(f"  ✓ Dibuat: {saluran_file.name}")

def main():
    """Fungsi utama untuk memproses semua folder"""
    data_public_path = Path("data/public")
    
    if not data_public_path.exists():
        print("❌ Folder data/public tidak ditemukan!")
        return
    
    print("🚀 Memulai proses upload batch file untuk data/public")
    print("=" * 60)
    
    # Dapatkan semua folder di data/public
    folders = [f for f in data_public_path.iterdir() if f.is_dir()]
    
    if not folders:
        print("❌ Tidak ada folder ditemukan di data/public")
        return
    
    print(f"📊 Ditemukan {len(folders)} folder untuk diproses")
    
    # Proses setiap folder
    for folder in sorted(folders):
        create_batch_files_for_folder(folder)
    
    print("\n" + "=" * 60)
    print("✅ Proses upload batch file selesai!")
    print(f"📁 Total folder diproses: {len(folders)}")
    
    # Tampilkan ringkasan
    print("\n📋 Ringkasan:")
    for folder in sorted(folders):
        json_files = list(folder.glob("*.json"))
        print(f"  {folder.name}: {len(json_files)} file JSON")

if __name__ == "__main__":
    main()