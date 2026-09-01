import { AuditTimeline } from '../components/AuditTimeline'
import { Activity, Filter, Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getAuditTrail } from '../utils/auditStorage'
import { showToast } from '../utils/toastBus'

export const AuditTrailPage: React.FC = () => {
  const [filterType, setFilterType] =
    useState<string | null>(null)
  const [auditTrail, setAuditTrail] = useState(() => getAuditTrail())

  useEffect(() => {
    const handler = () => setAuditTrail(getAuditTrail())
    window.addEventListener('audit-updated', handler)
    return () => window.removeEventListener('audit-updated', handler)
  }, [])

  const eventTypes = [
    'request',
    'search',
    'recommendation',
    'approval',
    'order',
    'payment',
    'support',
    'product',
    'error',
  ]

  const filteredEvents = filterType
    ? auditTrail.filter(
        (e) => e.type === filterType
      )
    : auditTrail

  const exportCSV = () => {
    if (!filteredEvents.length) {
      showToast('No audit events available to export.', 'error')
      return
    }

    const headers = [
      'Timestamp',
      'Type',
      'Status',
      'Description',
    ]

    const rows = filteredEvents.map((event) => [
      new Date(event.timestamp).toISOString(),
      event.type,
      event.status,
      event.description,
    ])

    const escapeCSV = (value: unknown) => {
      const text = String(value ?? '')
      return `"${text.replace(/"/g, '""')}"`
    }

    const csv = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) =>
        row.map(escapeCSV).join(',')
      ),
    ].join('\n')

    const blob = new Blob(
      [csv],
      {
        type: 'text/csv;charset=utf-8;',
      }
    )

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `ai-commerce-audit-trail-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Activity size={32} />
            Audit Trail
          </h1>

          <p className="text-gray-500 mt-2">
            Complete transaction and interaction history
            for compliance and analysis.
          </p>
        </div>

        {/* Filters */}
        <div className="my-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Filter size={16} />
            Filter by Type
          </h3>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType(null)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium ${
                filterType === null
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              All
            </button>

            {eventTypes.map((type) => (
              <button
                key={type}
                onClick={() =>
                  setFilterType(type)
                }
                className={`px-4 py-2 rounded-lg border text-sm font-medium capitalize ${
                  filterType === type
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500">
              Total Events
            </p>
            <p className="text-2xl font-bold mt-1">
              {auditTrail.length}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500">
              Successful
            </p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {
                auditTrail.filter(
                  (e) => e.status === 'success'
                ).length
              }
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500">
              Failed
            </p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {
                auditTrail.filter(
                  (e) => e.status === 'failed'
                ).length
              }
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500">
              Pending
            </p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {
                auditTrail.filter(
                  (e) => e.status === 'pending'
                ).length
              }
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-8">
            Event Timeline
          </h2>

          <AuditTimeline events={filteredEvents} />
        </div>

        {/* Export */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-900">
              Export audit data
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Download the currently filtered events as a
              CSV file.
            </p>
          </div>

          <button
            onClick={exportCSV}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>
    </div>
  )
}