import { ScannerPage } from './ScannerPage';

export const metadata = {
  title: 'QR Scanner | PENRO Batanes ICT Inventory',
  description: 'Scan an equipment QR code to open and verify its details on-site.',
};

export default function ScannerRoute() {
  return <ScannerPage />;
}
