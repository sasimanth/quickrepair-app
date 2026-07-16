const SecurityAlert = require('../models/SecurityAlert');
const AdminAuditLog = require('../models/AdminAuditLog');

// @desc    Get aggregated security alerts and dashboard stats
// @route   GET /api/admin/security/alerts
// @access  Private/Admin
const getSecurityAlerts = async (req, res) => {
  try {
    const alerts = await SecurityAlert.find().sort({ createdAt: -1 });

    // Aggregate stats
    const stats = {
      total: alerts.length,
      unresolved: alerts.filter(a => !a.isResolved).length,
      severityCounts: {
        low: alerts.filter(a => a.severity === 'low').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        high: alerts.filter(a => a.severity === 'high').length
      },
      typeCounts: alerts.reduce((acc, curr) => {
        acc[curr.alertType] = (acc[curr.alertType] || 0) + 1;
        return acc;
      }, {})
    };

    res.json({ stats, alerts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all administrative audit logs
// @route   GET /api/admin/security/audit-logs
// @access  Private/Admin
const getAuditLogs = async (req, res) => {
  try {
    const logs = await AdminAuditLog.find().sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resolve a security alert
// @route   PUT /api/admin/security/alerts/:id/resolve
// @access  Private/Admin
const resolveAlert = async (req, res) => {
  try {
    const { resolutionNotes } = req.body;
    const alert = await SecurityAlert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'Security alert not found' });
    }

    alert.isResolved = true;
    alert.resolvedBy = req.user.id;
    alert.resolutionNotes = resolutionNotes || 'Resolved by Administrator';
    await alert.save();

    res.json({ message: 'Security alert resolved successfully', alert });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSecurityAlerts,
  getAuditLogs,
  resolveAlert
};
