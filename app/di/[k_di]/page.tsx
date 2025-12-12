import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function DIRedirectPage({ params }: { params: { k_di: string } }) {
  // Redirect dari /di/[k_di] ke /daerah-irigasi/[k_di]
  redirect(`/daerah-irigasi/${params.k_di}`);
}
