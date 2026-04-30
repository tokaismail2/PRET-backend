// //agenda to check everyday on end date if expire update status to closed and winnerFactory and final_price



// export function defineAuctionJobs(agenda: Agenda, auctionModel: Model<AuctionDocument>) {

//   // ─── Job Definition ───────────────────────────────────────────────
//   agenda.define('check-expired-auctions', async (job) => {
//     const now = new Date();

//     // Find all open auctions whose end date has passed
//     const expiredAuctions = await auctionModel
//       .find({
//         status: 'open',
//         is_finished: false,
//         ends_at: { $lte: now },
//       })
//       .exec();

//     if (!expiredAuctions.length) {
//       console.log('[Agenda] No expired auctions found.');
//       return;
//     }

//     console.log(`[Agenda] Processing ${expiredAuctions.length} expired auction(s)...`);

//     for (const auction of expiredAuctions) {
//       // Fetch the highest bid for this auction from the Bid collection
//       const highestBid = await mongoose.connection
//         .collection('bids')
//         .findOne(
//           { auction_id: auction._id },
//           { sort: { amount: -1 } },          // highest bid first
//         );

//       await auctionModel.findByIdAndUpdate(auction._id, {
//         status: 'closed',
//         is_finished: true,
//         winnerFactory: highestBid?.bidder_id ?? null,
//         final_price: highestBid?.amount ?? auction.current_price,
//       });

//       console.log(
//         `[Agenda] Auction ${auction._id} closed. ` +
//         (highestBid
//           ? `Winner: ${highestBid.bidder_id} | Final price: ${highestBid.amount}`
//           : 'No bids placed.'),
//       );
//     }
//   });

//   // ─── Schedule ─────────────────────────────────────────────────────
//   // Runs every 5 minutes
//   agenda.every('*/5 * * * *', 'check-expired-auctions');
// }