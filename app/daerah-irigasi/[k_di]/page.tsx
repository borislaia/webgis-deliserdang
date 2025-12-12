import { createServerSupabase } from '@/lib/supabase/server';
import DaerahIrigasiView from '@/components/DaerahIrigasiView';

export const dynamic = 'force-dynamic';

export default async function DaerahIrigasiPage({ params }: { params: { k_di: string } }) {
    const supabase = createServerSupabase();

    // PERFORMANCE FIX: Parallelize all queries with Promise.all
    const [
        { data: allDI },
        { data: selectedDI },
        imageFilesResult,
        pdfFilesResult
    ] = await Promise.all([
        // Query 1: Fetch all DI for sidebar
        supabase
            .from('daerah_irigasi')
            .select('k_di, n_di, kecamatan')
            .order('k_di', { ascending: true }),

        // Query 2: Fetch selected DI details
        supabase
            .from('daerah_irigasi')
            .select('*')
            .eq('k_di', params.k_di)
            .maybeSingle(),

        // Query 3: Fetch images (with error handling)
        supabase.storage
            .from('images')
            .list(`${params.k_di}/citra`, {
                limit: 100,
                sortBy: { column: 'name', order: 'asc' },
            })
            .catch((error: any) => {
                console.error('Error loading images:', error);
                return { data: null, error };
            }),

        // Query 4: Fetch PDFs (with error handling)
        supabase.storage
            .from('pdf')
            .list(params.k_di, {
                limit: 100,
                sortBy: { column: 'name', order: 'asc' },
            })
            .catch((error: any) => {
                console.error('Error loading PDFs:', error);
                return { data: null, error };
            })
    ]);

    // Process images
    let images: string[] = [];
    if (imageFilesResult.data) {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
        images = imageFilesResult.data
            .filter((file) => {
                const name = (file.name || '').toLowerCase();
                return imageExtensions.some((ext) => name.endsWith(ext));
            })
            .map((file) => {
                const { data } = supabase.storage
                    .from('images')
                    .getPublicUrl(`${params.k_di}/citra/${file.name}`);
                return data.publicUrl;
            });
    }

    // Process PDFs
    let pdfs: Array<{ name: string; url: string }> = [];
    if (pdfFilesResult.data) {
        pdfs = pdfFilesResult.data
            .filter((file) => {
                const name = (file.name || '').toLowerCase();
                return name.endsWith('.pdf');
            })
            .map((file) => {
                const { data } = supabase.storage
                    .from('pdf')
                    .getPublicUrl(`${params.k_di}/${file.name}`);
                return {
                    name: file.name,
                    url: data.publicUrl,
                };
            });
    }

    return (
        <DaerahIrigasiView
            allDI={allDI || []}
            selectedDI={selectedDI}
            selectedKDI={params.k_di}
            images={images}
            pdfs={pdfs}
        />
    );
}
