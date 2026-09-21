import { EquipmentVerificationExperience } from '@/components/inventory/EquipmentVerificationExperience';
import { decodeEquipmentReference } from '@/lib/qrEquipment';

export const metadata = {
  title: 'Verify Equipment | PENRO Batanes ICT Inventory',
  description: 'Confirm the current details of a PENRO Batanes ICT asset.',
};

export default async function VerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ asset?: string | string[] }>;
}) {
  const { asset } = await searchParams;
  const reference = Array.isArray(asset) ? asset[0] : asset;
  const propertyNumber = reference ? decodeEquipmentReference(reference) : null;

  return <EquipmentVerificationExperience propertyNumber={propertyNumber} />;
}
