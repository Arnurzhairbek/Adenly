import { DataTypes } from "sequelize";
import sequelize from "../db.js";
import User from "./userModel.js";

const Course = sequelize.define("Course", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  level: {
    type: DataTypes.ENUM("beginner", "intermediate", "advanced"),
    defaultValue: "beginner",
  },
  language: { type: DataTypes.STRING, allowNull: false },
  image: { type: DataTypes.STRING },
});

User.hasMany(Course, { foreignKey: "authorId" });
Course.belongsTo(User, { as: "author", foreignKey: "authorId" });

export default Course;
