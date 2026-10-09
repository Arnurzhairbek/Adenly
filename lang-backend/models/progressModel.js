import { DataTypes } from "sequelize";
import sequelize from "../db.js";
import User from "./userModel.js";
import Course from "./courseModel.js";
import Lesson from "./lessonModel.js";

const Progress = sequelize.define("Progress", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  percentage: { type: DataTypes.FLOAT, defaultValue: 0 },
});

User.hasMany(Progress, { foreignKey: "userId" });
Progress.belongsTo(User, { foreignKey: "userId" });

Course.hasMany(Progress, { foreignKey: "courseId" });
Progress.belongsTo(Course, { foreignKey: "courseId" });

// связь "многие ко многим" между Progress и Lesson
Progress.belongsToMany(Lesson, {
  through: "ProgressLessons",
  foreignKey: "progressId",
});
Lesson.belongsToMany(Progress, {
  through: "ProgressLessons",
  foreignKey: "lessonId",
});

export default Progress;
