const socketio = require("socket.io");
let io;
const {
  addUser,
  removeUser,
  findSender,
  findReciever,
  getUser,
} = require("./users");
const { getError, getSuccessData } = require("../helper_functions/helpers");

// There is socket connection established and there is connection & disconnection
const setUpSocket = (server) => {
  io = socketio(server);
  io.on("connect", (socket) => {
    console.log("socket_id:", socket.id);
    socket.on("join", async ({ token }, callback) => {
      try {
        const { error, user } = await addUser({ token, socketId: socket.id });
        console.log("user added and joined::", user);
        if (error) return callback(getError(error));
        socket.broadcast.emit("userOnlineStatus", {
          user_id: user.id,
          online_status: true,
          online_status_time: new Date(),
        });
        return callback(
          getSuccessData("User Connected to Socket Successfully.")
        );
      } catch (err) {
        if (err && err.message) {
          console.log(getError(err.message));
          return getError(err.message);
        }
        console.log(getError(err));
        return getError(err);
      }
    });
    socket.on("logout", () => {
      console.log("iam logout listener");
      socket.disconnect(true);
    });
    socket.on("disconnect", async () => {
      const user = await removeUser(socket.id);
      console.log("disconnected_user", user);
      if (user) {
        socket.broadcast.emit("userOnlineStatus", {
          user_id: user.id,
          online_status: false,
          online_status_time: new Date(),
        });
      }
      console.log(`A User Disconnected With Socket_Id:${socket.id}`);
    });
  });
};
// End this section

// These are all emitter for front-end to emit data in socket
const newGroupCreated = (groupMembers, creator_id, group_name, group_id, group_image, created_at, is_group_chat) => {
  const chkCreator = findSender(creator_id);
  if (chkCreator) {
    groupMembers?.forEach((user) => {
      const chkReciever = findReciever(user?.member_id);
      if (chkReciever) {
        io.to(chkReciever.socketId).emit("newGroupCreated", {
          group_id,
          group_name,
          group_image,
          created_at,
          is_group_chat,
        });
      }
    });
  }
};

const addMemberToGroup = (admin_id, groupMembers, group_id, group_image, group_name, last_message, last_message_time, is_group_chat) => {
  const chkCreator = findSender(admin_id);
  if (chkCreator) {
    groupMembers?.forEach((user) => {
      const chkReciever = findReciever(user?.member_id);
      if (chkReciever) {
        io.to(chkReciever.socketId).emit("addedToGroup", {
          group_id,
          group_name,
          group_image,
          last_message,
          last_message_time,
          is_group_chat,
        });
      }
    });
  }
};

const removeMember = (admin_id, member_id, group_id, is_removed_from_group) => {
  const chkAdmin = findSender(admin_id);
  if (chkAdmin) {
    const chkRemoved = findReciever(member_id);
    if (chkRemoved) {
      io.to(chkRemoved.socketId).emit("removeFromGroup", {
        group_id,
        is_removed_from_group,
      });
    }
  }
};

const sendMessageToGroup = (sender_id, user_sender, reciever, message, reply_of, media, message_type, group_id,longitude,latitude) => {
  const chkSender = findSender(sender_id);
  if (chkSender) {
    reciever?.forEach((user) => {
      const reciever_id = user?.member?.user_id;
      const chkReciever = findReciever(reciever_id);
      if (chkReciever) {
        io.to(chkReciever.socketId).emit("newGroupMessage", {
          sender_id,
          user_sender: user_sender,
          attatchment: media,
          message_body: message,
          reply_of,
          message_type,
          group_id,
          longitude,
          latitude,
          message_time: new Date().toLocaleTimeString(),
        });
      }
    });
  }
};

const sendTextMessage = (sender_id, user_sender, reciever_id, textMessage, reply_of, media, message_type, group_id, longitude,latitude) => {
  const chkSender = findSender(sender_id);
  if (chkSender) {
    const chkReciever = findReciever(reciever_id);
    if (chkReciever) {
      io.to(chkReciever.socketId).emit("newTextMessage", {
        sender_id,
        user_sender: user_sender,
        reciever_id,
        message_body: textMessage,
        reply_of,
        attatchment: media,
        message_type,
        group_id,
        longitude,
        latitude,
        message_time: new Date().toLocaleTimeString(),
      });
    }
  }
};

const sendContactMessageToGroup = (sender_id, reciever, contacts) => {
  const chkSender = findSender(sender_id);
  if (chkSender) {
    reciever?.forEach((user) => {
      const reciever_id = user?.member?.user_id;
      const chkReciever = findReciever(reciever_id);
      if (chkReciever) {
        io.to(chkReciever.socketId).emit("newContactMessageGroup", {
          contacts,
        });
      }
    });
  }
};

const sendMediaMessageToGroup = (sender_id, reciever, media) => {
  const chkSender = findSender(sender_id);
  if (chkSender) {
    reciever?.forEach((user) => {
      const reciever_id = user?.member?.user_id;
      const chkReciever = findReciever(reciever_id);
      if (chkReciever) {
        io.to(chkReciever.socketId).emit("newGroupMediaMessage", {
          media,
        });
      }
    });
  }
};

const sendMediaMessage = (sender_id, reciever_id, media) => {
  const chkSender = findSender(sender_id);
  if (chkSender) {
    const chkReciever = findReciever(reciever_id);
    if (chkReciever) {
      io.to(chkReciever.socketId).emit("newMediaMessageOneToOne", {
        media,
      });
    }
  }
};

const sendContactMessage = (sender_id, reciever_id, contacts) => {
  const chkSender = findSender(sender_id);
  if (chkSender) {
    const chkReciever = findReciever(reciever_id);
    if (chkReciever) {
      io.to(chkReciever.socketId).emit("newContactMessageOneToOne", {
        contacts,
      });
    }
  }
};

const seenMessages = (reciever_id,sender_id)=>{
  const chkSender = findSender(sender_id);
  if (chkSender) {
    const chkReciever = findReciever(reciever_id);
    if (chkReciever) {
      io.to(chkReciever.socketId).emit("seenMessageOneToOne", {
        sender_id,
        reciever_id,
        seen: true,
      });
    }
  }
};

const muteSpecificChatNotification = (user_id,group_id,i_mute_this_group) =>{
  const chkUser = findSender(user_id);
  if (chkUser) {
      io.to(chkUser.socketId).emit("muteSpecificChatNotification", {
        group_id,
        i_mute_this_group,
      });
    }
};

const globallyMutePrivateChat = (user_id, is_private_chat_notifications) =>{
  const chkUser = findSender(user_id);
  if (chkUser) {
      io.to(chkUser.socketId).emit("muteNotificationGloballyForPrivateChat", {
        group_id,
        is_private_chat_notifications,
      });
    }
};

const globallyMuteGroupChat = (user_id, is_group_chat_notifications) =>{
  const chkUser = findSender(user_id);
  if (chkUser) {
      io.to(chkUser.socketId).emit("muteNotificationGloballyForGroupChat", {
        group_id,
        is_group_chat_notifications,
      });
    }
};
// End Emitters

module.exports = {
  setUpSocket,
  sendTextMessage,
  sendMessageToGroup,
  newGroupCreated,
  addMemberToGroup,
  removeMember,
  sendMediaMessage,
  sendMediaMessageToGroup,
  sendContactMessage,
  sendContactMessageToGroup,
  seenMessages,
  muteSpecificChatNotification,
  globallyMuteGroupChat,
  globallyMutePrivateChat,
};
