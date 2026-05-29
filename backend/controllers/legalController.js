const LegalDocument = require('../models/LegalDocument');
const LegalAcceptance = require('../models/LegalAcceptance');
const User = require('../models/User');

// Get active document by type
const getDocument = async (req, res) => {
  try {
    const { type } = req.params;
    let doc = await LegalDocument.findOne({ type });
    if (!doc) {
      // Return a clean default if not seeded yet
      const titleMap = {
        privacy_policy: 'Privacy Policy',
        terms_conditions: 'Terms & Conditions',
        refund_policy: 'Refund Policy',
        cancellation_policy: 'Cancellation Policy',
        technician_terms: 'Technician Service Agreement',
        user_agreement: 'User Agreement'
      };
      return res.json({
        type,
        title: titleMap[type] || 'Legal Policy',
        content: 'This policy is currently being updated by the administration. Please check back soon.',
        version: 1
      });
    }
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update / create document (Admin only)
const updateDocument = async (req, res) => {
  try {
    const { type } = req.params;
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    let doc = await LegalDocument.findOne({ type });
    if (doc) {
      doc.title = title;
      doc.content = content;
      doc.version += 1;
      doc.updatedBy = req.user.id;
      await doc.save();
    } else {
      doc = await LegalDocument.create({
        type,
        title,
        content,
        version: 1,
        updatedBy: req.user.id
      });
    }

    res.json({ message: 'Document updated successfully', document: doc });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all documents (Admin only)
const getAllDocuments = async (req, res) => {
  try {
    const docs = await LegalDocument.find({}).sort({ type: 1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Log acceptance manually (for existing users accepting updates)
const acceptDocument = async (req, res) => {
  try {
    const { documentType, version } = req.body;
    if (!documentType || !version) {
      return res.status(400).json({ message: 'documentType and version are required' });
    }

    const log = await LegalAcceptance.findOneAndUpdate(
      { userId: req.user.id, documentType, version },
      { userId: req.user.id, documentType, version, acceptedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Policy accepted successfully', log });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get compliance logs (Admin only)
const getComplianceLogs = async (req, res) => {
  try {
    const logs = await LegalAcceptance.find({}).sort({ acceptedAt: -1 }).limit(100);
    
    // Resolve user details manually
    const resolvedLogs = await Promise.all(logs.map(async (log) => {
      const user = await User.findById(log.userId).select('name email role');
      return {
        _id: log._id,
        userId: log.userId,
        userName: user ? user.name : 'Unknown User',
        userEmail: user ? user.email : 'N/A',
        userRole: user ? user.role : 'N/A',
        documentType: log.documentType,
        version: log.version,
        acceptedAt: log.acceptedAt
      };
    }));

    res.json(resolvedLogs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getDocument, updateDocument, getAllDocuments, acceptDocument, getComplianceLogs };
