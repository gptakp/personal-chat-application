import random

from flask import request, render_template
from flask_mail import Message
from werkzeug.security import generate_password_hash

from app import mail, db
from models.OtpModel import Otp
from models.UserModel import User

# yag = yagmail.SMTP("koyiladavignesh@gmail.com", "bofigeusuhftespu")
# To = "koyiladavignesh@gmail.com"
# Subject = "Hiii"
# Body = """<!doctype html>
# <html lang="en">
#   <head>
#     <meta name="viewport" content="width=device-width, initial-scale=1.0">
#     <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
#     <title>Simple Transactional Email</title>
#     <style media="all" type="text/css">
#     /* -------------------------------------
#     GLOBAL RESETS
# ------------------------------------- */
#
#     body {
#       font-family: Helvetica, sans-serif;
#       -webkit-font-smoothing: antialiased;
#       font-size: 16px;
#       line-height: 1.3;
#       -ms-text-size-adjust: 100%;
#       -webkit-text-size-adjust: 100%;
#     }
#
#     table {
#       border-collapse: separate;
#       mso-table-lspace: 0pt;
#       mso-table-rspace: 0pt;
#       width: 100%;
#     }
#
#     table td {
#       font-family: Helvetica, sans-serif;
#       font-size: 16px;
#       vertical-align: top;
#     }
#     /* -------------------------------------
#     BODY & CONTAINER
# ------------------------------------- */
#
#     body {
#       background-color: #f4f5f6;
#       margin: 0;
#       padding: 0;
#     }
#
#     .body {
#       background-color: #f4f5f6;
#       width: 100%;
#     }
#
#     .container {
#       margin: 0 auto !important;
#       max-width: 600px;
#       padding: 0;
#       padding-top: 24px;
#       width: 600px;
#     }
#
#     .content {
#       box-sizing: border-box;
#       display: block;
#       margin: 0 auto;
#       max-width: 600px;
#       padding: 0;
#     }
#     /* -------------------------------------
#     HEADER, FOOTER, MAIN
# ------------------------------------- */
#
#     .main {
#       background: #ffffff;
#       border: 1px solid #eaebed;
#       border-radius: 16px;
#       width: 100%;
#     }
#
#     .wrapper {
#       box-sizing: border-box;
#       padding: 24px;
#     }
#
#     .footer {
#       clear: both;
#       padding-top: 24px;
#       text-align: center;
#       width: 100%;
#     }
#
#     .footer td,
#     .footer p,
#     .footer span,
#     .footer a {
#       color: #9a9ea6;
#       font-size: 16px;
#       text-align: center;
#     }
#     /* -------------------------------------
#     TYPOGRAPHY
# ------------------------------------- */
#
#     p {
#       font-family: Helvetica, sans-serif;
#       font-size: 16px;
#       font-weight: normal;
#       margin: 0;
#       margin-bottom: 16px;
#     }
#
#     a {
#       color: #0867ec;
#       text-decoration: underline;
#     }
#     /* -------------------------------------
#     BUTTONS
# ------------------------------------- */
#
#     .btn {
#       box-sizing: border-box;
#       min-width: 100% !important;
#       width: 100%;
#     }
#
#     .btn > tbody > tr > td {
#       padding-bottom: 16px;
#     }
#
#     .btn table {
#       width: auto;
#     }
#
#     .btn table td {
#       background-color: #ffffff;
#       border-radius: 4px;
#       text-align: center;
#     }
#
#     .btn a {
#       background-color: #ffffff;
#       border: solid 2px #0867ec;
#       border-radius: 4px;
#       box-sizing: border-box;
#       color: #0867ec;
#       cursor: pointer;
#       display: inline-block;
#       font-size: 16px;
#       font-weight: bold;
#       margin: 0;
#       padding: 12px 24px;
#       text-decoration: none;
#       text-transform: capitalize;
#     }
#
#     .btn-primary table td {
#       background-color: #0867ec;
#     }
#
#     .btn-primary a {
#       background-color: #0867ec;
#       border-color: #0867ec;
#       color: #ffffff;
#     }
#
#     @media all {
#       .btn-primary table td:hover {
#         background-color: #ec0867 !important;
#       }
#       .btn-primary a:hover {
#         background-color: #ec0867 !important;
#         border-color: #ec0867 !important;
#       }
#     }
#
#     /* -------------------------------------
#     OTHER STYLES THAT MIGHT BE USEFUL
# ------------------------------------- */
#
#     .last {
#       margin-bottom: 0;
#     }
#
#     .first {
#       margin-top: 0;
#     }
#
#     .align-center {
#       text-align: center;
#     }
#
#     .align-right {
#       text-align: right;
#     }
#
#     .align-left {
#       text-align: left;
#     }
#
#     .text-link {
#       color: #0867ec !important;
#       text-decoration: underline !important;
#     }
#
#     .clear {
#       clear: both;
#     }
#
#     .mt0 {
#       margin-top: 0;
#     }
#
#     .mb0 {
#       margin-bottom: 0;
#     }
#
#     .preheader {
#       color: transparent;
#       display: none;
#       height: 0;
#       max-height: 0;
#       max-width: 0;
#       opacity: 0;
#       overflow: hidden;
#       mso-hide: all;
#       visibility: hidden;
#       width: 0;
#     }
#
#     .powered-by a {
#       text-decoration: none;
#     }
#
#     /* -------------------------------------
#     RESPONSIVE AND MOBILE FRIENDLY STYLES
# ------------------------------------- */
#
#     @media only screen and (max-width: 640px) {
#       .main p,
#       .main td,
#       .main span {
#         font-size: 16px !important;
#       }
#       .wrapper {
#         padding: 8px !important;
#       }
#       .content {
#         padding: 0 !important;
#       }
#       .container {
#         padding: 0 !important;
#         padding-top: 8px !important;
#         width: 100% !important;
#       }
#       .main {
#         border-left-width: 0 !important;
#         border-radius: 0 !important;
#         border-right-width: 0 !important;
#       }
#       .btn table {
#         max-width: 100% !important;
#         width: 100% !important;
#       }
#       .btn a {
#         font-size: 16px !important;
#         max-width: 100% !important;
#         width: 100% !important;
#       }
#     }
#     /* -------------------------------------
#     PRESERVE THESE STYLES IN THE HEAD
# ------------------------------------- */
#
#     @media all {
#       .ExternalClass {
#         width: 100%;
#       }
#       .ExternalClass,
#       .ExternalClass p,
#       .ExternalClass span,
#       .ExternalClass font,
#       .ExternalClass td,
#       .ExternalClass div {
#         line-height: 100%;
#       }
#       .apple-link a {
#         color: inherit !important;
#         font-family: inherit !important;
#         font-size: inherit !important;
#         font-weight: inherit !important;
#         line-height: inherit !important;
#         text-decoration: none !important;
#       }
#       #MessageViewBody a {
#         color: inherit;
#         text-decoration: none;
#         font-size: inherit;
#         font-family: inherit;
#         font-weight: inherit;
#         line-height: inherit;
#       }
#     }
#     </style>
#   </head>
#   <body>
#     <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="body">
#       <tr>
#         <td>&nbsp;</td>
#         <td class="container">
#           <div class="content">
#
#             <!-- START CENTERED WHITE CONTAINER -->
#             <span class="preheader">This is preheader text. Some clients will show this text as a preview.</span>
#             <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="main">
#
#               <!-- START MAIN CONTENT AREA -->
#               <tr>
#                 <td class="wrapper">
#                   <p>Hi there</p>
#                   <p>Sometimes you just want to send a simple HTML email with a simple design and clear call to action. This is it.</p>
#                   <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn btn-primary">
#                     <tbody>
#                       <tr>
#                         <td align="left">
#                           <table role="presentation" border="0" cellpadding="0" cellspacing="0">
#                             <tbody>
#                               <tr>
#                                 <td> <a href="http://htmlemail.io" target="_blank">Call To Action</a> </td>
#                               </tr>
#                             </tbody>
#                           </table>
#                         </td>
#                       </tr>
#                     </tbody>
#                   </table>
#                   <p>This is a really simple email template. It's sole purpose is to get the recipient to click the button with no distractions.</p>
#                   <p>Good luck! Hope it works.</p>
#                 </td>
#               </tr>
#
#               <!-- END MAIN CONTENT AREA -->
#               </table>
#
#             <!-- START FOOTER -->
#             <div class="footer">
#               <table role="presentation" border="0" cellpadding="0" cellspacing="0">
#                 <tr>
#                   <td class="content-block">
#                     <span class="apple-link">Company Inc, 7-11 Commercial Ct, Belfast BT1 2NB</span>
#                     <br> Don't like these emails? <a href="http://htmlemail.io/blog">Unsubscribe</a>.
#                   </td>
#                 </tr>
#                 <tr>
#                   <td class="content-block powered-by">
#                     Powered by <a href="http://htmlemail.io">HTMLemail.io</a>
#                   </td>
#                 </tr>
#               </table>
#             </div>
#
#             <!-- END FOOTER -->
#
# <!-- END CENTERED WHITE CONTAINER --></div>
#         </td>
#         <td>&nbsp;</td>
#       </tr>
#     </table>
#   </body>
# </html>"""
class SendMail:
    @staticmethod
    def sendMail():
        username = request.form['username']
        usertype = request.form['type']

        user = User.query.filter_by(username=username).first()
        if usertype == 'custom':
            if not user:

                # Check if user already exists
                if User.query.filter_by(username=username).first():
                    return {"message": "User already exists"}, 400

                # Hash the password and create a new user
                hashed_password = generate_password_hash('Welcome@123')
                new_user = User(username=username, password=hashed_password)

                db.session.add(new_user)
                db.session.commit()
            try:
                # Create the message
                msg = Message("Your OTP Code", recipients=[username])
                otp = ''.join([str(random.randint(0, 9)) for _ in range(5)])

                otp_instance = Otp(user_id=user.id, otp=otp)
                db.session.add(otp_instance)

                db.session.commit()

                # Render the email body with the template
                msg.html = render_template('email_templates/template1.html', username=username, otp=otp)

                # Send the email
                mail.send(msg)

                print("Successfully sent")  # Log success
                return {"message": "Mail sent successfully"}, 200

            except Exception as e:
                print(e)  # Log the exception
                return {"message": "Error sending mail"}, 400
        else:
            return {
                "message": 'User not supported for this action'
            }, 404