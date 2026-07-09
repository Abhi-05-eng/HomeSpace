const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const generateInvoice = (booking, home, guest) => {

    const invoiceDir = path.join(__dirname, "../invoices");

    if (!fs.existsSync(invoiceDir)) {
        fs.mkdirSync(invoiceDir);
    }

    const fileName = `invoice-${booking._id}.pdf`;

    const filePath = path.join(invoiceDir, fileName);

    const doc = new PDFDocument({ margin: 50 });

    doc.pipe(fs.createWriteStream(filePath));

    doc
        .fontSize(24)
        .fillColor("#10b981")
        .text("HomeSpace", { align: "center" });

    doc
        .moveDown()
        .fontSize(20)
        .fillColor("black")
        .text("BOOKING INVOICE", { align: "center" });

    doc.moveDown();

    doc.fontSize(14);

    doc.text(`Invoice ID : HS-${booking._id}`);

    doc.text(`Booking Date : ${new Date().toLocaleDateString("en-IN")}`);

    doc.moveDown();

    doc.text(`Guest : ${guest.firstName} ${guest.lastName || ""}`);

    doc.text(`Email : ${guest.email}`);

    doc.moveDown();

    doc.text(`Property : ${home.houseName}`);

    doc.text(`Location : ${home.location}`);

    doc.moveDown();

    doc.text(`Check In : ${new Date(booking.checkIn).toLocaleDateString("en-IN")}`);

    doc.text(`Check Out : ${new Date(booking.checkOut).toLocaleDateString("en-IN")}`);

    doc.text(`Guests : ${booking.guests}`);

    doc.text(`Nights : ${booking.nights}`);

    doc.moveDown();

    doc.fontSize(16);

    doc.text(`Total Paid : ₹${booking.totalPrice}`);

    doc.text(`Payment Status : ${booking.paymentStatus}`);

    doc.text(`Payment ID : ${booking.paymentId}`);

    doc.text(`Order ID : ${booking.orderId}`);

    doc.moveDown(2);

    doc
        .fontSize(12)
        .fillColor("gray")
        .text("Thank you for choosing HomeSpace.", {
            align: "center"
        });

    doc.end();

    return filePath;
};

module.exports = generateInvoice;