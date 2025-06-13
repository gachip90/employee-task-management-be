const { db } = require('../firebase-config');

class Message {
  // Get message by group
  async getMessagesByGroup(groupId) {
    try {
      const snapshot = await db
        .collection('messages')
        .where('groupId', '==', groupId)
        .orderBy('timestamp', 'asc')
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate().toISOString(),
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw new Error('Failed to fetch messages');
    }
  }
};

module.exports = new Message();