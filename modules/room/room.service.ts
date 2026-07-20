import { Room } from "@/models/Room";
import connectToDatabase from "@/lib/db";

export class RoomService {
  static async getAllRooms() {
    await connectToDatabase();
    return await Room.find({}).populate("roomTypeId").populate("categoryId").populate("floorId");
  }

  static async updateRoomStatus(roomId: string, status: string) {
    await connectToDatabase();
    return await Room.findByIdAndUpdate(roomId, { status }, { new: true });
  }
}
