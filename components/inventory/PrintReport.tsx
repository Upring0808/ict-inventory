import { AppBrand } from '@/components/branding/AppBrand';
import { getLocationDistribution, calculateSummary } from '@/lib/summaryUtils';
import { getEquipmentYear } from '@/lib/inventoryFormatting';
import type { InventoryItem } from '@/types/inventory';

interface PrintReportProps {
  items: InventoryItem[];
  scope: string;
  generatedAt: Date | null;
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function isDisposalItem(item: InventoryItem) {
  return item.statusCategory === 'For Disposal'
    || item.status?.toLowerCase().includes('disposal')
    || item.status?.toLowerCase().includes('condemned');
}

export function PrintReport({ items, scope, generatedAt }: PrintReportProps) {
  if (!generatedAt) return null;

  const summary = calculateSummary(items);
  const locations = getLocationDistribution(items, 8);
  const needsAttention = items.filter((item) => (
    item.statusCategory === 'Needs Attention'
    || item.statusCategory === 'Parts Replacement'
    || item.statusCategory === 'For Repair'
  ) && !isDisposalItem(item)).length;
  const disposal = items.filter(isDisposalItem).length;
  const notYetFound = items.filter((item) => item.statusCategory === 'Not Yet Found').length;
  const shownLocations = locations.reduce((total, location) => total + location.count, 0);
  const otherLocationCount = Math.max(0, summary.total - shownLocations);

  const typeStats = [
    { label: 'Desktop computers', count: summary.desktopCount },
    { label: 'Laptop computers', count: summary.laptopCount },
    { label: 'Printers', count: summary.printerCount },
    { label: 'Scanners', count: summary.scannerCount },
  ];

  return (
    <article className="print-report" aria-label="Inventory report prepared for printing">
      <header className="report-header">
        <div className="report-brand">
          <AppBrand
            variant="lockup"
            size={36}
            organizationName="PENRO Batanes"
            productName="ICT"
            productDescriptor="Inventory"
            organizationClassName="report-brand__agency"
            nameClassName="report-brand__name"
            descriptorClassName="report-brand__descriptor"
          />
          <p className="report-brand__office">Provincial Environment and Natural Resources Office</p>
        </div>
        <div className="report-date">
          <span>Generated</span>
          <strong>{generatedAt.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}</strong>
        </div>
        <div className="report-title-band">
          <div>
            <p className="report-eyebrow">OFFICIAL INVENTORY RECORD</p>
            <h1>ICT Equipment Inventory Report</h1>
          </div>
          <p className="report-scope"><strong>Scope</strong>{scope}</p>
        </div>
        <div className="report-accent-rule" />
      </header>

      <section className="report-section report-overview" aria-labelledby="report-overview-heading">
        <div className="report-section-heading">
          <div>
            <p className="report-kicker">01 / INVENTORY PROFILE</p>
            
          </div>
          <p className="report-total"><strong>{summary.total.toLocaleString()}</strong><span>assets in scope</span></p>
        </div>
        <div className="report-type-grid">
          {typeStats.map((stat) => (
            <div className="report-type-stat" key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.count.toLocaleString()}</strong>
            </div>
          ))}
          <div className="report-type-stat report-type-stat--aged">
            <span>Beyond five years</span>
            <div className="report-type-stat__values">
              <strong>{summary.beyond5YearsCount.toLocaleString()}</strong>
              <small>{summary.agingRate}% of inventory</small>
            </div>
          </div>
          <div className="report-type-stat report-type-stat--rate">
            <span>Serviceable rate</span>
            <strong>{summary.serviceableRate}%</strong>
          </div>
        </div>
      </section>

      <div className="report-detail-grid">
        <section className="report-section report-condition" aria-labelledby="report-condition-heading">
          <div className="report-section-heading report-section-heading--compact">
            <div>
              <p className="report-kicker">02 / CONDITION</p>
              <h2 id="report-condition-heading">Serviceability breakdown</h2>
            </div>
          </div>
          <dl className="report-condition-list">
            <div><dt><span className="report-dot report-dot--serviceable" />Serviceable</dt><dd>{summary.serviceableCount}</dd></div>
            <div><dt><span className="report-dot report-dot--attention" />Needs attention<small>Includes repair and parts replacement</small></dt><dd>{needsAttention}</dd></div>
            <div><dt><span className="report-dot report-dot--disposal" />For disposal</dt><dd>{disposal}</dd></div>
            {notYetFound > 0 && <div><dt><span className="report-dot report-dot--other" />Not yet found</dt><dd>{notYetFound}</dd></div>}
          </dl>
        </section>

        <section className="report-section report-locations" aria-labelledby="report-locations-heading">
          <div className="report-section-heading report-section-heading--compact">
            <div>
              <p className="report-kicker">03 / DISTRIBUTION</p>
              <h2 id="report-locations-heading">Main office locations</h2>
            </div>
          </div>
          {locations.length ? (
            <div className="report-location-list">
              {locations.map((location) => (
                <div key={location.location}>
                  <span>{location.location}</span>
                  <strong>{location.count}</strong>
                </div>
              ))}
              {otherLocationCount > 0 && <div><span>Other locations</span><strong>{otherLocationCount}</strong></div>}
            </div>
          ) : (
            <p className="report-empty">No location data in this report scope.</p>
          )}
        </section>
      </div>

      <section className="report-section report-register" aria-labelledby="report-register-heading">
        <div className="report-section-heading report-register-heading">
          <div>
            <p className="report-kicker">04 / ASSET REGISTER</p>
            <h2 id="report-register-heading">Assets included in this report</h2>
          </div>
          <p>{items.length.toLocaleString()} {items.length === 1 ? 'record' : 'records'}</p>
        </div>
        <table className="report-table">
          <colgroup>
            <col className="report-col-property" />
            <col className="report-col-type" />
            <col className="report-col-model" />
            <col className="report-col-serial" />
            <col className="report-col-office" />
            <col className="report-col-officer" />
            <col className="report-col-year" />
            <col className="report-col-condition" />
            <col className="report-col-pms" />
            <col className="report-col-remarks" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Property number</th>
              <th scope="col">Equipment type</th>
              <th scope="col">Brand / model</th>
              <th scope="col">Serial number</th>
              <th scope="col">Office / division</th>
              <th scope="col">Accountable officer</th>
              <th scope="col">Year acquired</th>
              <th scope="col">Condition / status</th>
              <th scope="col">PMS date</th>
              <th scope="col">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {items.length ? items.map((item) => (
              <tr key={item.id}>
                <td className="report-property-number">{item.propertyNumber || '—'}</td>
                <td>{item.equipmentType}</td>
                <td>{[item.brand, item.model].filter(Boolean).join(' / ') || '—'}</td>
                <td>{item.serialNumber || '—'}</td>
                <td>{item.location || 'Unassigned'}</td>
                <td>{item.accountablePersonnel || '—'}</td>
                <td>{getEquipmentYear(item) || '—'}</td>
                <td><strong>{item.statusCategory}</strong><br />{item.status}</td>
                <td>{formatDate(item.datePmsConducted)}</td>
                <td>{item.remarks || '—'}</td>
              </tr>
            )) : (
              <tr><td className="report-empty-row" colSpan={10}>No assets match the selected dashboard filters.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <footer className="report-footer" aria-label="Report certification">
        <div className="report-signature">
          <p>Prepared by</p>
          <span aria-label="Name and signature" />
          <small>ICT Technical Support Staff</small>
        </div>
        <div className="report-signature">
          <p>Noted by</p>
          <span aria-label="Name and signature" />
          <small>Information Systems Analyst II</small>
        </div>
        <div className="report-signature">
          <p>Attested by</p>
          <span aria-label="Name and signature" />
          <small>AO I / Supply Officer</small>
        </div>
      </footer>
    </article>
  );
}
