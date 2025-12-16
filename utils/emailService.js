const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  pool: true, // Enable connection pooling
  maxConnections: 5, // Limit concurrent connections
  maxMessages: 100, // Limit messages per connection
  auth: {
    user: "dgt.portfolio.ma@gmail.com",
    pass: "ppvk tunb tpir neht",
  },
});

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const mailOptions = {
      from: "dgt.portfolio.ma@gmail.com",
      to,
      subject,
      html: htmlContent,
    };
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

const welcomeTemplate = (username) => `
<div style="direction: ltr; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #e5e5e5; font-size: 14px;">

  <!-- Header Compact -->
  <div style="text-align: center; padding: 10px 0; background: #fafafa; border-bottom: 1px solid #ededed;">
    <img src="https://res.cloudinary.com/dynprvsfg/image/upload/v1765243945/DGTplogo_1_fpek3w.png" alt="DGT Portfolio" style="max-width: 100px; height: auto;" />
  </div>

  <!-- Content Compact -->
  <div style="padding: 15px 20px; text-align: center;">

    <h1 style="color: #0f0f0f; font-size: 20px; font-weight: 700; margin: 0 0 8px;">
      Welcome to DGT Portfolio
    </h1>

    <div style="width: 40px; height: 2px; background-color: #000; margin: 0 auto 12px; border-radius: 2px;"></div>

    <p style="color: #555; line-height: 1.5; margin: 0 0 12px;">
      Hi <strong>${username}</strong>,<br/>
      We're thrilled to have you onboard! Your account is now active, and your 
      <strong>7-day free trial</strong> has officially started.
    </p>

    <!-- Features List Compact -->
    <div style="text-align: left; direction: ltr; display: inline-block; width: 100%; max-width: 420px; font-size: 13px; margin-bottom: 15px; background: #fdfdfd; padding: 10px; border: 1px solid #eee; border-radius: 6px;">
      <strong style="display: block; margin-bottom: 5px; color: #000;">Instant Features:</strong>
      <ul style="margin: 0; padding-left: 20px; text-align: left; line-height: 1.4;">
        <li style="margin-bottom: 4px;">🔗 <strong>Custom Subdomain:</strong> A link with your name like <em>name.dgtportfolio.com</em> or connect your own custom domain.</li>
        <li style="margin-bottom: 4px;">📱 <strong>QR Code Profile:</strong> A QR code for instant sharing of your digital portfolio.</li>
        <li style="margin-bottom: 4px;">🔍 <strong>SEO Optimized:</strong> Your portfolio is optimized to appear on search engines like Google.</li>
        <li style="margin-bottom: 0;">🎨 <strong>Themes:</strong> Customize the look and feel of your digital portfolio.</li>
      </ul>
    </div>

    <!-- Direct Headline Link -->
    <div style="margin-bottom: 15px; direction: ltr;">
      <span style="font-size: 13px; font-weight: 600; color: #333;">Link: </span>
      <a href="https://dgtportfolio.com/update-profile" style="font-size: 13px; color: #2563eb; text-decoration: underline;">https://dgtportfolio.com/update-profile</a>
    </div>

    <!-- Button Compact -->
    <a href="https://dgtportfolio.com" style="display: inline-block; background-color: #000; color: #fff; text-decoration: none; padding: 10px 30px; border-radius: 6px; font-weight: 600; font-size: 14px;">
      Go to Dashboard
    </a>

    <p style="color: #7d7d7d; font-size: 12px; margin-top: 10px; margin-bottom: 0;">
      Start creating and sharing your personal portfolio today.
    </p>

  </div>

  <!-- Footer Minimal -->
  <div style="background-color: #fafafa; padding: 8px; text-align: center; color: #8c8c8c; border-top: 1px solid #ededed; font-size: 11px;">
    &copy; ${new Date().getFullYear()} DGT Portfolio. All rights reserved.
  </div>

</div>
`;

const trialExpiredTemplate = (username) => `
<div style="direction: ltr; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #e5e5e5; font-size: 14px;">

  <!-- Header Compact -->
  <div style="text-align: center; padding: 10px 0; background: #fafafa; border-bottom: 1px solid #ededed;">
    <img src="https://res.cloudinary.com/dynprvsfg/image/upload/v1765243945/DGTplogo_1_fpek3w.png" alt="DGT Portfolio" style="max-width: 100px; height: auto;" />
  </div>

  <!-- Content Compact -->
  <div style="padding: 15px 20px; text-align: center;">

    <h1 style="color: #0f0f0f; font-size: 20px; font-weight: 700; margin: 0 0 8px;">
      Trial Expired
    </h1>
    
    <div style="width: 40px; height: 2px; background-color: #000; margin: 0 auto 12px; border-radius: 2px;"></div>

    <p style="color: #555; line-height: 1.5; margin: 0 0 12px;">
      Hi <strong>${username}</strong>,<br/>
      We hope you enjoyed your 7-day free trial. Your trial period has ended, but your journey doesn't have to stop here.
    </p>

    <!-- Promo Box Compact -->
    <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 15px; border-radius: 6px; margin: 0 auto 15px; max-width: 350px;">
        <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 5px; font-weight: 600;">Exclusive Gift For You</p>
        <div style="font-family: monospace; font-size: 20px; color: #000; font-weight: 700; letter-spacing: 2px; margin-bottom: 4px;">
            G7A2Q1DK
        </div>
        <p style="color: #64748b; font-size: 11px; margin: 0;">Use this promo code for a special discount!</p>
    </div>

    <!-- Direct Headline Link -->
    <div style="margin-bottom: 15px; direction: ltr;">
      <span style="font-size: 13px; font-weight: 600; color: #333;">Link: </span>
      <a href="https://dgtportfolio.com/subscription" style="font-size: 13px; color: #2563eb; text-decoration: underline;">https://dgtportfolio.com/subscription</a>
    </div>

    <!-- Button Compact -->
    <a href="https://dgtportfolio.com/subscription" style="display: inline-block; background-color: #000; color: #fff; text-decoration: none; padding: 10px 30px; border-radius: 6px; font-weight: 600; font-size: 14px;">
      Subscribe Now & Save
    </a>

    <p style="color: #7d7d7d; font-size: 12px; margin-top: 10px; margin-bottom: 0;">
      Unlock the full potential of your portfolio and keep impressing your audience.
    </p>

  </div>

  <!-- Footer Minimal -->
  <div style="background-color: #fafafa; padding: 8px; text-align: center; color: #8c8c8c; border-top: 1px solid #ededed; font-size: 11px;">
    &copy; ${new Date().getFullYear()} DGT Portfolio. All rights reserved.
  </div>

</div>
`;

module.exports = {
  sendEmail,
  welcomeTemplate,
  trialExpiredTemplate
};
