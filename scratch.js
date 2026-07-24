const mongoose = require("mongoose");

const MONGODB_URI = "mongodb+srv://dinujaheshan:%2ADinujaHeshan12@cluster0.p1udjcl.mongodb.net/ghrms?retryWrites=true&w=majority&appName=Cluster0";

async function check() {
  await mongoose.connect(MONGODB_URI);
  
  const bookingSchema = new mongoose.Schema({}, { strict: false, collection: "bookings" });
  const Booking = mongoose.model("Booking", bookingSchema);
  
  const guestSchema = new mongoose.Schema({}, { strict: false, collection: "guests" });
  const Guest = mongoose.model("Guest", guestSchema);
  
  const bookings = await Booking.find().sort({ createdAt: -1 }).limit(5).lean();
  
  console.log("Latest 5 bookings:");
  for (const b of bookings) {
    console.log(`Booking ID: ${b._id}, GuestID: ${b.guestId}`);
    if (b.guestId) {
      const guest = await Guest.findById(b.guestId).lean();
      console.log(`  -> Guest found in DB? ${guest ? "YES, " + guest.firstName : "NO!"}`);
    }
    console.log(`  -> Room IDs: ${b.roomIds}`);
  }
  
  mongoose.disconnect();
}

check().catch(console.error);
