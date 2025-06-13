const messageModel = require('../models/message'); 

// Get message by group id
exports.getMessages = async (req, res) => {
  const { groupId } = req.query;
  if (!groupId) {
    return res.status(400).json({ error: 'groupId is required' });
  }

  try {
    const messages = await messageModel.getMessagesByGroup(groupId);
    res.json({ data: messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



