const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.error('Missing Twilio configuration in .env file');
  console.error('Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

class SMSService {
  
  static async sendAccessCode(phoneNumber, accessCode) {
    try {
      const messageBody = `Mã xác thực của bạn là: ${accessCode}.`;
      
      const message = await client.messages.create({
        body: messageBody,
        from: twilioPhoneNumber,
        to: phoneNumber
      });
      
      return {
        success: true,
        messageSid: message.sid,
        status: message.status,
        to: message.to,
        from: message.from
      };
      
    } catch (error) {
      console.error('Error sending SMS:', error.message);
      
      let errorMessage = 'SMS sending failed';
      
      switch (error.code) {
        case 21211:
          errorMessage = 'Invalid phone number format';
          break;
        case 21614:
          errorMessage = 'Phone number is not a valid mobile number';
          break;
        case 21408:
          errorMessage = 'Permission to send SMS to this number is denied';
          break;
        case 21610:
          errorMessage = 'Phone number is blacklisted';
          break;
        case 30007:
          errorMessage = 'Message delivery failed';
          break;
        default:
          errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }
  
  static async getMessageStatus(messageSid) {
    try {
      const message = await client.messages(messageSid).fetch();
      return {
        sid: message.sid,
        status: message.status,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        to: message.to,
        from: message.from
      };
    } catch (error) {
      console.error('Error fetching message status:', error.message);
      throw error;
    }
  }
  
  static validatePhoneNumber(phoneNumber) {
    const internationalPhoneRegex = /^\+[1-9]\d{1,14}$/;
    const vietnamPhoneRegex = /^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/;
    
    return internationalPhoneRegex.test(phoneNumber) || vietnamPhoneRegex.test(phoneNumber);
  }
  
  static normalizePhoneNumber(phoneNumber) {
    let normalized = phoneNumber.replace(/[\s\-$$$$]/g, '');
    
    if (normalized.startsWith('0')) {
      normalized = '+84' + normalized.substring(1);
    } else if (normalized.startsWith('84') && !normalized.startsWith('+84')) {
      normalized = '+' + normalized;
    }
    
    return normalized;
  }
}

module.exports = SMSService;