import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export default function Reports() {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState('system');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exportFormat, setExportFormat] = useState('json');
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_URL}/api/responder/reports/generate`,
        {
          report_type: reportType,
          entity_ids: [],
          date_from: dateFrom || null,
          date_to: dateTo || null,
          metrics: []
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setReportData(response.data);
      alert('Report generated successfully!');
    } catch (error: any) {
      alert('Error generating report: ' + (error.response?.data?.detail || error.message));
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_URL}/api/responder/reports/export`,
        {
          export_format: exportFormat,
          data_type: 'inspections',
          filters: {}
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (exportFormat === 'json') {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${new Date().getTime()}.json`;
        a.click();
      }

      alert('Export successful!');
    } catch (error: any) {
      alert('Error exporting: ' + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div className=\"min-h-screen bg-gray-50\">
      {/* Header */}
      <div className=\"bg-white shadow-sm border-b border-gray-200\">
        <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6\">
          <div className=\"flex justify-between items-center\">
            <div>
              <h1 className=\"text-3xl font-bold text-gray-900\">Report Generator</h1>
              <p className=\"mt-1 text-sm text-gray-500\">Create custom reports and export data</p>
            </div>
            <button
              onClick={() => navigate('/responder/dashboard')}
              className=\"px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700\"
            >
              ← Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className=\"max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8\">
        <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
          {/* Report Generator */}
          <div className=\"bg-white rounded-lg shadow p-6\">
            <h2 className=\"text-xl font-semibold mb-4\">Generate Report</h2>
            
            <div className=\"space-y-4\">
              <div>
                <label className=\"block text-sm font-medium text-gray-700 mb-1\">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className=\"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500\"
                >
                  <option value=\"system\">System-wide Report</option>
                  <option value=\"office\">Office Report</option>
                  <option value=\"school\">School Report</option>
                  <option value=\"district\">District Report</option>
                </select>
              </div>

              <div>
                <label className=\"block text-sm font-medium text-gray-700 mb-1\">Date From</label>
                <input
                  type=\"date\"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className=\"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500\"
                />
              </div>

              <div>
                <label className=\"block text-sm font-medium text-gray-700 mb-1\">Date To</label>
                <input
                  type=\"date\"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className=\"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500\"
                />
              </div>

              <button
                onClick={handleGenerateReport}
                disabled={generating}
                className=\"w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center\"
              >
                {generating ? (
                  <>
                    <div className=\"animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2\"></div>
                    Generating...
                  </>
                ) : (
                  'Generate Report'
                )}
              </button>
            </div>
          </div>

          {/* Data Export */}
          <div className=\"bg-white rounded-lg shadow p-6\">
            <h2 className=\"text-xl font-semibold mb-4\">Export Data</h2>
            
            <div className=\"space-y-4\">
              <div>
                <label className=\"block text-sm font-medium text-gray-700 mb-1\">Export Format</label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className=\"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500\"
                >
                  <option value=\"json\">JSON</option>
                  <option value=\"csv\">CSV</option>
                </select>
              </div>

              <div className=\"bg-gray-50 p-4 rounded-md\">
                <h3 className=\"text-sm font-medium text-gray-700 mb-2\">What will be exported:</h3>
                <ul className=\"text-sm text-gray-600 space-y-1 list-disc list-inside\">
                  <li>All inspection data</li>
                  <li>Office information</li>
                  <li>School details</li>
                  <li>Ratings and reviews</li>
                  <li>Compliance scores</li>
                </ul>
              </div>

              <button
                onClick={handleExport}
                className=\"w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center\"
              >
                <svg className=\"w-5 h-5 mr-2\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4\" />
                </svg>
                Export Data
              </button>
            </div>
          </div>
        </div>

        {/* Report Preview */}
        {reportData && (
          <div className=\"mt-8 bg-white rounded-lg shadow p-6\">
            <h2 className=\"text-xl font-semibold mb-4\">Report Preview</h2>
            
            <div className=\"space-y-4\">
              <div className=\"grid grid-cols-2 gap-4\">
                <div className=\"bg-blue-50 p-4 rounded-md\">
                  <p className=\"text-sm text-gray-600\">Total Inspections</p>
                  <p className=\"text-2xl font-bold text-blue-600\">{reportData.total_inspections}</p>
                </div>

                {reportData.rating_summary && (
                  <div className=\"bg-green-50 p-4 rounded-md\">
                    <p className=\"text-sm text-gray-600\">Average Rating</p>
                    <p className=\"text-2xl font-bold text-green-600\">{reportData.rating_summary.avg_rating}/5</p>
                  </div>
                )}

                {reportData.response_time_summary && (
                  <div className=\"bg-yellow-50 p-4 rounded-md\">
                    <p className=\"text-sm text-gray-600\">Avg Response Time</p>
                    <p className=\"text-2xl font-bold text-yellow-600\">
                      {reportData.response_time_summary.avg_response_time_days} days
                    </p>
                  </div>
                )}

                {reportData.response_time_summary && (
                  <div className=\"bg-purple-50 p-4 rounded-md\">
                    <p className=\"text-sm text-gray-600\">On-Time Rate</p>
                    <p className=\"text-2xl font-bold text-purple-600\">
                      {reportData.response_time_summary.on_time_rate}%
                    </p>
                  </div>
                )}
              </div>

              {reportData.inspection_summary && (
                <div>
                  <h3 className=\"text-lg font-semibold mb-2\">Status Breakdown</h3>
                  <div className=\"bg-gray-50 p-4 rounded-md\">
                    <div className=\"grid grid-cols-2 md:grid-cols-3 gap-3\">
                      {Object.entries(reportData.inspection_summary.by_status).map(([status, count]: [string, any]) => (
                        <div key={status} className=\"flex justify-between items-center\">
                          <span className=\"text-sm text-gray-600 capitalize\">{status}:</span>
                          <span className=\"text-sm font-semibold\">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className=\"flex space-x-3\">
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `report_${new Date().getTime()}.json`;
                    a.click();
                  }}
                  className=\"px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700\"
                >
                  Download Full Report
                </button>
                <button
                  onClick={() => setReportData(null)}
                  className=\"px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300\"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
