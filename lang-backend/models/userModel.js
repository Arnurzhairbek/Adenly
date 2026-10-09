import { DataTypes } from "sequelize";
import sequelize from "../db.js";

const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  avatar: { type: DataTypes.STRING },
  role: {
    type: DataTypes.ENUM("student", "teacher", "admin"),
    defaultValue: "student",
  },
  resetToken: { type: DataTypes.STRING },
  resetTokenExpire: { type: DataTypes.DATE },
});

export default User; 