const PDFDocument = require("pdfkit");

const generateOfferPDF = (candidate) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      // Header with company name
      doc.fontSize(24).font("Helvetica-Bold").text("OFFER LETTER", { align: "center" });
      doc.fontSize(12).font("Helvetica").text("PeopleConnect HRMS", { align: "center" });
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke("#667eea");
      doc.moveDown();

      // Date
      doc.fontSize(10).text(`Date: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: "right" });
      doc.moveDown(0.5);

      // Recipient details
      doc.fontSize(11).font("Helvetica-Bold").text(candidate.name);
      doc.fontSize(10).font("Helvetica").text(candidate.email);
      doc.moveDown();

      // Body
      doc.fontSize(11).font("Helvetica").text(`Dear ${candidate.name},`, { align: "left" });
      doc.moveDown();

      doc.fontSize(11).text(
        `We are delighted to extend an offer for the position of ${candidate.position} in the ${candidate.department} department at PeopleConnect HRMS. After careful consideration of your qualifications and interview performance, we believe you would be an excellent fit for our organization.`,
        { align: "left", width: 450 }
      );
      doc.moveDown();

      // Terms and Conditions
      doc.fontSize(12).font("Helvetica-Bold").text("OFFER TERMS:", { underline: true });
      doc.moveDown(0.3);

      doc.fontSize(11).font("Helvetica");
      doc.text(`Position Title: ${candidate.position}`, 70);
      doc.text(`Department: ${candidate.department}`, 70);
      doc.text(`Annual Salary: ₹${candidate.salary}`, 70);
      doc.text(`Date of Joining: ${new Date(candidate.joiningDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, 70);
      doc.moveDown();

      // Additional terms
      doc.fontSize(11).text(
        "This offer is contingent upon satisfactory completion of a background check and all other pre-employment verification procedures. Your employment will be on a probation period of 3 months as per company policy.",
        { align: "left", width: 450 }
      );
      doc.moveDown();

      if (candidate.offerMessage) {
        doc.fontSize(11).font("Helvetica-Bold").text("NOTES:", { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(11).font("Helvetica").text(candidate.offerMessage, { width: 450 });
        doc.moveDown();
      }

      // Acceptance
      doc.fontSize(11).text(
        "Please signify your acceptance of this offer by signing and returning the enclosed copy within 5 business days. Should you have any questions, feel free to reach out to our HR department.",
        { align: "left", width: 450 }
      );
      doc.moveDown();

      // Closing
      doc.fontSize(11).text("We look forward to welcoming you to our team.", { align: "left" });
      doc.moveDown();

      doc.text("Sincerely,");
      doc.moveDown(2);

      doc.text("___________________________");
      doc.text("Authorized HR Manager", { fontSize: 10 });
      doc.text("PeopleConnect HRMS", { fontSize: 10 });
      doc.moveDown();

      // Footer
      doc.moveTo(50, doc.page.height - 50).lineTo(550, doc.page.height - 50).stroke("#ddd");
      doc.fontSize(9).fillColor("#666").text(
        "PeopleConnect HRMS | hr@peopleconnecthr.com | www.peopleconnecthr.com",
        50,
        doc.page.height - 40,
        { align: "center" }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateOfferPDF };
