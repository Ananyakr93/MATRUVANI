/**
 * MATRUVANI — PDF/Print Referral Generator
 *
 * Creates a hidden printable A5 referral slip and triggers window.print().
 * Uses inline styles to ensure consistent print output across browsers.
 * DPDP Act 2023 compliant — prints minimal PII with timestamp.
 */

export function generateReferral(session, phc) {
  // Remove any existing print div
  const existing = document.getElementById('matruvani-print')
  if (existing) existing.remove()

  // Risk color mapping
  const riskColors = {
    HIGH: '#dc2626',
    MODERATE: '#d97706',
    LOW: '#16a34a'
  }
  const riskColor = riskColors[session.risk_level] || '#666'

  // Hindi risk label
  const riskLabels = {
    HIGH: 'उच्च जोखिम',
    MODERATE: 'मध्यम जोखिम',
    LOW: 'सामान्य'
  }
  const riskLabel = riskLabels[session.risk_level] || session.risk_level

  // Divergence flag display
  const divergenceDisplay = {
    RED: '🔴 लाल — भाषाई असंगति',
    AMBER: '🟡 पीला — संभावित असंगति',
    GREEN: '🟢 हरा — सामान्य'
  }

  const div = document.createElement('div')
  div.id = 'matruvani-print'
  div.innerHTML = `
    <div style="font-family: 'Noto Sans Devanagari', 'Inter', sans-serif; max-width: 148mm; margin: 0 auto; padding: 20px;">
      <!-- Header -->
      <div style="border-bottom: 2px solid #16a34a; padding-bottom: 12px; margin-bottom: 16px;">
        <h1 style="font-size: 20px; color: #16a34a; margin: 0; letter-spacing: 1px;">MATRUVANI</h1>
        <p style="font-size: 11px; color: #666; margin: 4px 0 0;">राष्ट्रीय स्वास्थ्य मिशन | Perinatal Mental Health Referral</p>
      </div>

      <!-- Patient / Session Details -->
      <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
        <tr>
          <td style="padding: 4px 8px; color: #666; width: 130px;">दिनांक:</td>
          <td style="padding: 4px 8px;">${session.session_date || new Date().toISOString().split('T')[0]}</td>
        </tr>
        <tr>
          <td style="padding: 4px 8px; color: #666;">ग्राम कोड:</td>
          <td style="padding: 4px 8px;">${session.village_code || '—'}</td>
        </tr>
        <tr>
          <td style="padding: 4px 8px; color: #666;">EPDS स्कोर:</td>
          <td style="padding: 4px 8px;"><strong>${session.epds_score}/30</strong></td>
        </tr>
        <tr>
          <td style="padding: 4px 8px; color: #666;">जोखिम:</td>
          <td style="padding: 4px 8px;"><strong style="color:${riskColor}">${riskLabel} (${session.risk_level})</strong></td>
        </tr>
        <tr>
          <td style="padding: 4px 8px; color: #666;">विचलन ध्वज:</td>
          <td style="padding: 4px 8px;">${divergenceDisplay[session.divergence_flag] || session.divergence_flag || '—'}</td>
        </tr>
      </table>

      <!-- PHC Action Box -->
      <div style="margin-top: 16px; padding: 12px; background: #fef3c7; border-radius: 8px; border: 1px solid #fbbf24;">
        <p style="font-size: 12px; font-weight: bold; margin: 0 0 4px; color: #92400e;">PHC कार्रवाई:</p>
        <p style="font-size: 12px; margin: 0; color: #78350f;">
          ${session.risk_level === 'HIGH'
            ? 'तत्काल मानसिक स्वास्थ्य मूल्यांकन आवश्यक। कृपया माँ को प्राथमिकता के आधार पर देखें।'
            : 'अनुवर्ती मानसिक स्वास्थ्य मूल्यांकन की सिफारिश। अगली ASHA विज़िट पर पुनः जाँच होगी।'}
        </p>
      </div>

      <!-- PHC Info -->
      <div style="margin-top: 16px;">
        <p style="font-size: 11px; color: #666;">PHC: ${phc?.phc_name || phc?.name || '—'}</p>
        <p style="font-size: 11px; color: #666;">Session ID: ${session.id ? String(session.id).substring(0, 8) : '—'}</p>
      </div>

      <!-- Footer / Compliance -->
      <div style="margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 8px;">
        <p style="font-size: 10px; color: #999; margin: 0;">
          DPDP अधिनियम 2023 के अनुसार गोपनीय। अनधिकृत वितरण वर्जित है।
        </p>
        <p style="font-size: 10px; color: #999; margin: 2px 0 0;">
          मुद्रण: ${new Date().toLocaleString('hi-IN')}
        </p>
      </div>
    </div>
  `

  document.body.appendChild(div)
  window.print()
}
