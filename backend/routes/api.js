import express from 'express';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'WebGIS Deli Serdang API is running',
    timestamp: new Date().toISOString()
  });
});

// Data kecamatan endpoint
router.get('/data/kecamatan', (req, res) => {
  // TODO: Implementasi pengambilan data dari database
  res.json({ 
    message: 'Data kecamatan endpoint',
    data: []
  });
});

// Data daerah irigasi endpoint
router.get('/data/irigasi', (req, res) => {
  res.json({ 
    message: 'Data daerah irigasi endpoint',
    data: []
  });
});

// Data pemanfaatan SDA endpoint
router.get('/data/sda', (req, res) => {
  res.json({ 
    message: 'Data pemanfaatan SDA endpoint',
    data: []
  });
});

// Data rawan bencana endpoint
router.get('/data/bencana', (req, res) => {
  res.json({ 
    message: 'Data rawan bencana endpoint',
    data: []
  });
});

// Data infrastruktur SDA endpoint
router.get('/data/infrastruktur', (req, res) => {
  res.json({ 
    message: 'Data infrastruktur SDA endpoint',
    data: []
  });
});

export default router;
