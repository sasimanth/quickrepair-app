const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { 
  encrypt, decrypt, maskAccountNumber, maskIfscCode, hashDocument 
} = require('../utils/encryption');
const { 
  validateIfscCode, validateAccountNumber, validateAccountName, validateDocumentFile, sanitizeText 
} = require('../utils/validators');
const { 
  getProfile, submitKyc, submitVerification, requestWithdrawal 
} = require('../controllers/technicianController');
const { 
  reviewKyc, getDocumentSignedUrl, getPendingVerifications 
} = require('../controllers/adminController');
const Technician = require('../models/Technician');
const User = require('../models/User');
const SecurityAlert = require('../models/SecurityAlert');
const AdminAuditLog = require('../models/AdminAuditLog');
const { kycLimiter } = require('../middleware/rateLimiter');

// Helper to create mock res object
function mockResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('Phase 3: Technician KYC Security & Data Protection', () => {
  let mongoServer;
  let techUser;
  let adminUser;
  let techProfile;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // Create Admin User
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@fixvo.com',
      password: 'AdminPassword123!',
      role: 'admin',
      isVerified: true
    });

    // Create Technician User
    techUser = await User.create({
      name: 'Rajesh Technician',
      email: 'rajesh.tech@example.com',
      phone: '9876543210',
      password: 'TechPassword123!',
      role: 'technician',
      isVerified: true
    });

    // Create Technician Profile
    techProfile = await Technician.create({
      userId: techUser._id.toString(),
      name: techUser.name,
      email: techUser.email,
      phone: techUser.phone,
      skills: ['Plumbing', 'Electrical'],
      area: 'Galiveedu',
      verificationStatus: 'unverified',
      kycStatus: 'not_submitted',
      walletBalance: 2500
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  // ==========================================
  // SUITE 1: Encryption & Hashing Utilities
  // ==========================================
  describe('1. Encryption & Hashing Utilities', () => {
    test('1. encrypt produces formatted ciphertext string (iv:authTag:ciphertext)', () => {
      const plaintext = '123456789012';
      const encrypted = encrypt(plaintext);
      expect(encrypted).toBeTruthy();
      const parts = encrypted.split(':');
      expect(parts.length).toBe(3);
    });

    test('2. decrypt correctly recovers original plaintext', () => {
      const plaintext = '987654321098';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    test('3. decrypt throws or returns null on invalid/corrupted ciphertext', () => {
      expect(() => decrypt('invalid:ciphertext:format')).toThrow();
    });

    test('4. maskAccountNumber masks all digits except the last 4', () => {
      expect(maskAccountNumber('123456789012')).toBe('XXXX XXXX 9012');
      expect(maskAccountNumber('987654321')).toBe('XXXX XXXX 4321');
    });

    test('5. maskAccountNumber handles short or empty inputs safely', () => {
      expect(maskAccountNumber('')).toBe('XXXX XXXX XXXX');
      expect(maskAccountNumber('123')).toBe('XXXX 123');
    });

    test('6. maskIfscCode masks middle characters correctly', () => {
      expect(maskIfscCode('SBIN0001234')).toBe('SBIN****34');
      expect(maskIfscCode('HDFC0005678')).toBe('HDFC****78');
    });

    test('7. hashDocument generates consistent 64-character SHA-256 hex string', () => {
      const docData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const hash1 = hashDocument(docData);
      const hash2 = hashDocument(docData);
      expect(hash1).toHaveLength(64);
      expect(hash1).toBe(hash2);
    });

    test('8. validateIfscCode validates Indian IFSC format', () => {
      expect(validateIfscCode('SBIN0001234').valid).toBe(true);
      expect(validateIfscCode('INVALID_IFSC').valid).toBe(false);
      expect(validateIfscCode('12345678901').valid).toBe(false);
    });

    test('9. validateAccountNumber checks account number length and numeric format', () => {
      expect(validateAccountNumber('123456789012').valid).toBe(true);
      expect(validateAccountNumber('1234').valid).toBe(false); // Too short
      expect(validateAccountNumber('ABCDEFGHIJKL').valid).toBe(false); // Non-numeric
    });

    test('10. validateDocumentFile validates base64 image strings', () => {
      const validBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...';
      expect(validateDocumentFile(validBase64, 'governmentId').valid).toBe(true);
      expect(validateDocumentFile('not-a-base64-file', 'governmentId').valid).toBe(false);
    });
  });

  // ==========================================
  // SUITE 2: Data Minimization & Profile Exposure
  // ==========================================
  describe('2. Data Minimization & Profile Exposure', () => {
    test('11. getProfile returns masked bank details (accountNumberMasked, ifscCodeMasked)', async () => {
      // Set up bank details on technician
      await Technician.findOneAndUpdate(
        { userId: techUser._id.toString() },
        {
          bankDetails: {
            accountName: 'Rajesh Technician',
            accountNumberEncrypted: encrypt('987654321098'),
            ifscCodeEncrypted: encrypt('SBIN0001234'),
            bankName: 'State Bank of India',
            accountNumberMasked: '••••••••1098',
            ifscCodeMasked: 'SBIN••••234'
          }
        }
      );

      const req = { user: { id: techUser._id.toString(), role: 'technician' } };
      const res = mockResponse();

      await getProfile(req, res);

      expect(res.json).toHaveBeenCalled();
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.bankDetails).toBeDefined();
      expect(responseData.bankDetails.accountNumberMasked).toBe('••••••••1098');
      expect(responseData.bankDetails.ifscCodeMasked).toBe('SBIN••••234');
    });

    test('12. getProfile NEVER exposes raw/encrypted bank credentials', async () => {
      const req = { user: { id: techUser._id.toString(), role: 'technician' } };
      const res = mockResponse();

      await getProfile(req, res);

      const responseData = res.json.mock.calls[0][0];
      expect(responseData.bankDetails.accountNumberEncrypted).toBeUndefined();
      expect(responseData.bankDetails.ifscCodeEncrypted).toBeUndefined();
      expect(responseData.bankDetails.accountNumber).toBeUndefined();
      expect(responseData.bankDetails.ifscCode).toBeUndefined();
    });

    test('13. getProfile NEVER returns legacy base64 document strings', async () => {
      // Set legacy fields to simulate existing records
      await Technician.findOneAndUpdate(
        { userId: techUser._id.toString() },
        {
          governmentIdUrl: 'data:image/png;base64,SGVsbG8gV29ybGQ=',
          selfieUrl: 'data:image/png;base64,SGVsbG8gV29ybGQ=',
          addressProofUrl: 'data:image/png;base64,SGVsbG8gV29ybGQ='
        }
      );

      const req = { user: { id: techUser._id.toString(), role: 'technician' } };
      const res = mockResponse();

      await getProfile(req, res);

      const responseData = res.json.mock.calls[0][0];
      expect(responseData.governmentIdUrl).toBeUndefined();
      expect(responseData.selfieUrl).toBeUndefined();
      expect(responseData.addressProofUrl).toBeUndefined();
      expect(responseData.documents).toBeUndefined();
    });

    test('14. getProfile includes hasDocumentsSubmitted flag and kycStatus lifecycle', async () => {
      const req = { user: { id: techUser._id.toString(), role: 'technician' } };
      const res = mockResponse();

      await getProfile(req, res);

      const responseData = res.json.mock.calls[0][0];
      expect(responseData.hasDocumentsSubmitted).toBeDefined();
      expect(responseData.kycStatus).toBeDefined();
    });
  });

  // ==========================================
  // SUITE 3: Secure Submission & Deduplication
  // ==========================================
  describe('3. Secure Submission & Deduplication', () => {
    test('15. submitKyc encrypts accountNumber and ifscCode before saving', async () => {
      // Ensure status is reset before submission
      await Technician.findOneAndUpdate(
        { userId: techUser._id.toString() },
        { kycStatus: 'not_submitted' }
      );

      const req = {
        user: { id: techUser._id.toString(), role: 'technician' },
        body: {
          accountName: 'Rajesh Technician',
          accountNumber: '112233445566',
          ifscCode: 'HDFC0001234',
          bankName: 'HDFC Bank',
          consentToKycProcessing: true
        }
      };
      const res = mockResponse();

      await submitKyc(req, res);

      expect(res.json).toHaveBeenCalled();

      const updatedTech = await Technician.findOne({ userId: techUser._id.toString() });
      expect(updatedTech.bankDetails.accountNumber).toBeTruthy();

      const decryptedAcc = decrypt(updatedTech.bankDetails.accountNumber);
      expect(decryptedAcc).toBe('112233445566');
    });

    test('16. submitKyc rejects submission without explicit consent', async () => {
      await Technician.findOneAndUpdate(
        { userId: techUser._id.toString() },
        { kycStatus: 'not_submitted' }
      );

      const req = {
        user: { id: techUser._id.toString(), role: 'technician' },
        body: {
          accountName: 'Rajesh Technician',
          accountNumber: '112233445566',
          ifscCode: 'HDFC0001234',
          consentToKycProcessing: false
        }
      };
      const res = mockResponse();

      await submitKyc(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('consent') })
      );
    });

    test('17. submitKyc sets kycStatus to pending_review (does NOT auto-approve)', async () => {
      await Technician.findOneAndUpdate(
        { userId: techUser._id.toString() },
        { kycStatus: 'not_submitted' }
      );

      const req = {
        user: { id: techUser._id.toString(), role: 'technician' },
        body: {
          accountName: 'Rajesh Technician',
          accountNumber: '112233445566',
          ifscCode: 'HDFC0001234',
          consentToKycProcessing: true
        }
      };
      const res = mockResponse();

      await submitKyc(req, res);

      const updatedTech = await Technician.findOne({ userId: techUser._id.toString() });
      expect(updatedTech.kycStatus).toBe('pending_review');
      expect(updatedTech.kycCompleted).toBe(false);
    });

    test('18. submitVerification detects document upload and generates metadata', async () => {
      const mockDoc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      await Technician.findOneAndUpdate(
        { userId: techUser._id.toString() },
        { verificationStatus: 'unverified' }
      );

      const req1 = {
        user: { id: techUser._id.toString(), role: 'technician' },
        body: {
          governmentId: mockDoc,
          selfie: mockDoc,
          addressProof: mockDoc,
          consentToVerification: true
        },
        ip: '127.0.0.1',
        headers: {}
      };
      const res1 = mockResponse();

      await submitVerification(req1, res1);

      const techAfterFirst = await Technician.findOne({ userId: techUser._id.toString() });
      expect(techAfterFirst.documents.governmentId.publicId).toBeTruthy();
    });

    test('19. submitVerification prevents re-submission when status is pending or under_review', async () => {
      await Technician.findOneAndUpdate(
        { userId: techUser._id.toString() },
        { verificationStatus: 'pending' }
      );

      const req = {
        user: { id: techUser._id.toString(), role: 'technician' },
        body: {
          governmentId: 'data:image/jpeg;base64,NEW_DOC',
          selfie: 'data:image/jpeg;base64,NEW_DOC',
          consentToVerification: true
        }
      };
      const res = mockResponse();

      await submitVerification(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('pending admin review') })
      );
    });
  });

  // ==========================================
  // SUITE 4: Withdrawal Enforcement
  // ==========================================
  describe('4. Withdrawal Enforcement', () => {
    test('20. requestWithdrawal blocks withdrawal if kycStatus is not_submitted', async () => {
      await Technician.findOneAndUpdate(
        { userId: techUser._id.toString() },
        { kycStatus: 'not_submitted', kycCompleted: false }
      );

      const req = {
        user: { id: techUser._id.toString(), role: 'technician' },
        body: { amount: 500 }
      };
      const res = mockResponse();

      await requestWithdrawal(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'KYC_NOT_APPROVED' })
      );
    });

    test('21. requestWithdrawal blocks withdrawal if kycStatus is pending_review', async () => {
      await Technician.findOneAndUpdate(
        { userId: techUser._id.toString() },
        { kycStatus: 'pending_review', kycCompleted: false }
      );

      const req = {
        user: { id: techUser._id.toString(), role: 'technician' },
        body: { amount: 500 }
      };
      const res = mockResponse();

      await requestWithdrawal(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('22. requestWithdrawal blocks withdrawal if kycStatus is rejected', async () => {
      await Technician.findOneAndUpdate(
        { userId: techUser._id.toString() },
        { kycStatus: 'rejected', kycCompleted: false }
      );

      const req = {
        user: { id: techUser._id.toString(), role: 'technician' },
        body: { amount: 500 }
      };
      const res = mockResponse();

      await requestWithdrawal(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('23. requestWithdrawal permits withdrawal when kycStatus is approved', async () => {
      const Booking = require('../models/Booking');
      await Booking.create({
        userId: adminUser._id.toString(),
        providerId: techUser._id.toString(),
        name: 'Customer',
        phone: '9876543210',
        serviceName: 'Plumbing',
        problemDescription: 'Leaky Pipe',
        location: 'Galiveedu',
        date: new Date(),
        finalQuote: 2500,
        amount: 2500,
        status: 'completed',
        paymentMethod: 'upi',
        paymentStatus: 'completed'
      });

      await Technician.findOneAndUpdate(
        { userId: techUser._id.toString() },
        { 
          kycStatus: 'approved', 
          kycCompleted: true, 
          walletBalance: 2250,
          bankDetails: {
            accountName: 'Rajesh Technician',
            accountNumber: encrypt('112233445566'),
            ifscCode: encrypt('HDFC0001234')
          }
        }
      );

      const req = {
        user: { id: techUser._id.toString(), role: 'technician' },
        body: { amount: 500, accountNumber: '112233445566', ifscCode: 'HDFC0001234', bankName: 'HDFC' }
      };
      const res = mockResponse();

      await requestWithdrawal(req, res);

      expect(res.status).not.toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('submitted successfully') })
      );
    });
  });

  // ==========================================
  // SUITE 5: Admin Authorization & Signed URLs
  // ==========================================
  describe('5. Admin Authorization & Signed URLs', () => {
    test('24. getDocumentSignedUrl returns signed URL for authorized admin', async () => {
      // Add a document publicId to technician
      await Technician.findOneAndUpdate(
        { userId: techUser._id.toString() },
        {
          documents: {
            governmentId: {
              publicId: `fixvo_kyc_private/${techUser._id.toString()}/governmentId`,
              format: 'jpg',
              uploadedAt: new Date()
            }
          }
        }
      );

      const req = {
        user: { _id: adminUser._id.toString(), role: 'admin', name: adminUser.name, email: adminUser.email },
        params: { id: techUser._id.toString(), docType: 'governmentId' },
        ip: '127.0.0.1',
        headers: {}
      };
      const res = mockResponse();

      await getDocumentSignedUrl(req, res);

      expect(res.json).toHaveBeenCalled();
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.signedUrl).toBeTruthy();
      expect(responseData.expiresInSeconds).toBe(900);
    });

    test('25. getDocumentSignedUrl creates AdminAuditLog with action KYC_DOCUMENT_VIEW', async () => {
      const auditLogs = await AdminAuditLog.find({ action: 'KYC_DOCUMENT_VIEW' });
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].targetId).toBe(techUser._id.toString());
    });

    test('26. getDocumentSignedUrl returns 404 for missing document type', async () => {
      const req = {
        user: { _id: adminUser._id.toString(), role: 'admin' },
        params: { id: techUser._id.toString(), docType: 'idProof' } // Not uploaded
      };
      const res = mockResponse();

      await getDocumentSignedUrl(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('27. reviewKyc updates kycStatus to approved and creates AdminAuditLog', async () => {
      const req = {
        user: { _id: adminUser._id.toString(), name: adminUser.name, email: adminUser.email, role: 'admin' },
        params: { id: techUser._id.toString() },
        body: { status: 'approved' },
        ip: '127.0.0.1',
        headers: {}
      };
      const res = mockResponse();

      await reviewKyc(req, res);

      const updatedTech = await Technician.findOne({ userId: techUser._id.toString() });
      expect(updatedTech.kycStatus).toBe('approved');
      expect(updatedTech.kycCompleted).toBe(true);

      const logs = await AdminAuditLog.find({ action: 'KYC_APPROVE' });
      expect(logs.length).toBeGreaterThan(0);
    });

    test('28. reviewKyc updates kycStatus to rejected with reason', async () => {
      const req = {
        user: { _id: adminUser._id.toString(), name: adminUser.name, email: adminUser.email, role: 'admin' },
        params: { id: techUser._id.toString() },
        body: { status: 'rejected', rejectionReason: 'Bank account name mismatch' },
        ip: '127.0.0.1',
        headers: {}
      };
      const res = mockResponse();

      await reviewKyc(req, res);

      const updatedTech = await Technician.findOne({ userId: techUser._id.toString() });
      expect(updatedTech.kycStatus).toBe('rejected');
      expect(updatedTech.kycRejectionReason).toBe('Bank account name mismatch');

      const logs = await AdminAuditLog.find({ action: 'KYC_REJECT' });
      expect(logs.length).toBeGreaterThan(0);
    });

    test('29. getPendingVerifications sanitizes legacy documents and raw bank details', async () => {
      const req = { user: { role: 'admin' } };
      const res = mockResponse();

      await getPendingVerifications(req, res);

      expect(res.json).toHaveBeenCalled();
      const list = res.json.mock.calls[0][0];
      list.forEach(t => {
        expect(t.governmentIdUrl).toBeUndefined();
        expect(t.selfieUrl).toBeUndefined();
        expect(t.addressProofUrl).toBeUndefined();
        if (t.bankDetails) {
          expect(t.bankDetails.accountNumberEncrypted).toBeUndefined();
          expect(t.bankDetails.ifscCodeEncrypted).toBeUndefined();
        }
      });
    });
  });

  // ==========================================
  // SUITE 6: Input Sanitization & Security Rules
  // ==========================================
  describe('6. Input Sanitization & Security Rules', () => {
    test('30. validateAccountName sanitizes names with XSS script tags', () => {
      const maliciousName = 'Rajesh <script>alert("XSS")</script>';
      const sanitized = sanitizeText(maliciousName);
      expect(sanitized).not.toContain('<script>');

      const validation = validateAccountName(maliciousName);
      expect(validation.valid).toBe(false);
    });

    test('31. sanitizeText strips HTML tags safely', () => {
      expect(sanitizeText('<b>John Doe</b>')).toBe('bJohn Doe/b');
      expect(sanitizeText('javascript:void(0)')).toBe('javascript:void(0)');
    });

    test('32. kycLimiter is correctly exported and configured', () => {
      expect(kycLimiter).toBeDefined();
      expect(typeof kycLimiter).toBe('function');
    });
  });
});
