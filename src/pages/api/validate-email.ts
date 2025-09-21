import dns from 'dns';
import util from 'util';

const resolveMx = util.promisify(dns.resolveMx);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ isValid: false, message: 'Email is required' });
  }

  try {
    const domain = email.split('@')[1];
    
    // Check if MX records exist for the domain
    try {
      const mxRecords = await resolveMx(domain);
      if (!mxRecords || mxRecords.length === 0) {
        return res.status(200).json({
          isValid: false,
          message: 'No valid mail server found for this domain'
        });
      }
    } catch (error) {
      return res.status(200).json({
        isValid: false,
        message: 'Invalid email domain'
      });
    }

    // If we get here, the domain has valid MX records
    return res.status(200).json({
      isValid: true,
      message: 'Email domain appears valid'
    });
  } catch (error) {
    return res.status(500).json({
      isValid: false,
      message: 'Error validating email'
    });
  }
}