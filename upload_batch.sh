#!/bin/bash

# Script untuk mengupload file batch ke setiap folder di data/public
# Menggunakan file template dari folder yang sudah memiliki data

echo "🚀 Memulai proses upload batch file untuk data/public"
echo "============================================================"

# Direktori sumber dan target
SOURCE_DIR="data/public"
TEMPLATE_FOLDER="12120008"  # Folder yang sudah memiliki file lengkap

# Cek apakah folder template ada
if [ ! -d "$SOURCE_DIR/$TEMPLATE_FOLDER" ]; then
    echo "❌ Folder template $TEMPLATE_FOLDER tidak ditemukan!"
    exit 1
fi

# Dapatkan daftar semua folder
folders=($(ls -d $SOURCE_DIR/*/ | xargs -n 1 basename))

echo "📊 Ditemukan ${#folders[@]} folder untuk diproses"

# Fungsi untuk menyalin file template
copy_template_files() {
    local target_folder=$1
    local source_folder="$SOURCE_DIR/$TEMPLATE_FOLDER"
    local target_path="$SOURCE_DIR/$target_folder"
    
    echo "📁 Memproses folder: $target_folder"
    
    # Cek apakah folder sudah memiliki file JSON
    if [ "$(ls -A $target_path/*.json 2>/dev/null)" ]; then
        echo "  ℹ️  Folder sudah memiliki file JSON"
        ls -la $target_path/*.json | awk '{print "    - " $9}'
        return
    fi
    
    # Salin file template
    echo "  📝 Menyalin file template..."
    
    # Salin file Bangunan
    if [ -f "$source_folder/${TEMPLATE_FOLDER}_Bangunan.json" ]; then
        cp "$source_folder/${TEMPLATE_FOLDER}_Bangunan.json" "$target_path/${target_folder}_Bangunan.json"
        echo "  ✓ Disalin: ${target_folder}_Bangunan.json"
    fi
    
    # Salin file Fungsional
    if [ -f "$source_folder/${TEMPLATE_FOLDER}_Fungsional.json" ]; then
        cp "$source_folder/${TEMPLATE_FOLDER}_Fungsional.json" "$target_path/${target_folder}_Fungsional.json"
        echo "  ✓ Disalin: ${target_folder}_Fungsional.json"
    fi
    
    # Salin file Saluran
    if [ -f "$source_folder/${TEMPLATE_FOLDER}_Saluran.json" ]; then
        cp "$source_folder/${TEMPLATE_FOLDER}_Saluran.json" "$target_path/${target_folder}_Saluran.json"
        echo "  ✓ Disalin: ${target_folder}_Saluran.json"
    fi
}

# Proses setiap folder
for folder in "${folders[@]}"; do
    copy_template_files "$folder"
    echo ""
done

echo "============================================================"
echo "✅ Proses upload batch file selesai!"
echo "📁 Total folder diproses: ${#folders[@]}"

# Tampilkan ringkasan
echo ""
echo "📋 Ringkasan:"
for folder in "${folders[@]}"; do
    json_count=$(ls $SOURCE_DIR/$folder/*.json 2>/dev/null | wc -l)
    echo "  $folder: $json_count file JSON"
done