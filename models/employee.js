const { db } = require('../firebase-config');

class Employee {
  // Get employee by email
    async getEmployeeByEmail(email) {
    try {
      const snapshot = await db.collection('employees')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error getting employee by email:', error);
      throw error;
    }
  }
};

module.exports = new Employee();