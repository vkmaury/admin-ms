import nodemailer from 'nodemailer';
import { IUser } from '../models/User'; // Adjust the path based on your project structure
import moment from 'moment-timezone';

export const sendSaleNotification = async (sellers: IUser[], saleDetails: any) => {
  try {
    // Set up nodemailer transporter (replace with your email service credentials)
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Example using Gmail, adjust accordingly
      auth: {
        user: 'vkm9559666733@gmail.com',
        pass: 'plwk jyts yvyx vipy',
      },
    });

    // Compose the email content
    const emailSubject = `Upcoming Sale on: ${saleDetails.name}`;
    const emailText = `Dear Seller,

We are excited to inform you about an upcoming sale on: ${saleDetails.name}.

Description: ${saleDetails.description}

Discount: ${saleDetails.saleDiscountApplied}% off on all products in the category: ${saleDetails.categoryNames}

Start Date: ${moment(saleDetails.startDate).format('YYYY-MM-DD HH:mm A')}

End Date: ${moment(saleDetails.endDate).format('YYYY-MM-DD HH:mm A')}

We encourage you to add your products to the sale and get ready for the event.

Best regards,

E-commerce app Team`;

    // Send email to all active sellers
    for (const seller of sellers) {
      await transporter.sendMail({
        from: '"E-commerce app" <vkm9559666733@gmail.com>',
        to: seller.email, // Assuming sellers have an email field
        subject: emailSubject,
        text: emailText,
      });
    }

    console.log('Emails sent successfully');
  } catch (error) {
    console.error('Error sending sale notification emails:', error);
    throw error; // Re-throw the error so it can be caught by the calling function
  }
};
