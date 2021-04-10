const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const Point = sequelize.define(
    'Point',
    {
      lat: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      lng: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
    },
    { tableName: 'points', createdAt: false, updatedAt: false },
  );
  return Point;
};
