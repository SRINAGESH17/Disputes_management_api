import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class UserRole extends Model {
    static associate(models) {
        UserRole.hasMany(models.Merchant, { foreignKey: 'userRole', as: 'merchants' });

        UserRole.hasMany(models.Staff, { foreignKey: 'userRole', as: 'staffMembers' });

    };
}


UserRole.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notNull: { msg: 'User ID is required' },
            isInt: { msg: 'User ID must be an integer' }
        }
    },
    userRef: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'User reference cannot be empty' },
            len: [3, 50]
        }
    },
    firebaseId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    staff: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    permissions: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
        allowNull: false,
        validate: {
            isValidPermissions(value) {
                if (!Array.isArray(value)) {
                    throw new Error('Permissions must be an array');
                }
            }
        }
    },
    merchant: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    navbarPermissions: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
        allowNull: false,
        validate: {
            isValidNavbarPermissions(value) {
                if (!Array.isArray(value)) {
                    throw new Error('Navbar permissions must be an array');
                }
            }
        }
    },
}, {
    sequelize,
    modelName: 'userRole',
    tableName: 'user_roles',
    timestamps: true,
});

export default UserRole;