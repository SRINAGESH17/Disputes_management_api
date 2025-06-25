
/**
 * UserRole Model
 * 
 * Represents the user role entity in the system, associating users with their roles,
 * permissions, and related entities such as merchants and staff members.
 * 
 * @extends Model
 * 
 * @typedef {Object} UserRole
 * @property {number} id - Primary key, auto-incremented integer.
 * @property {number} userId - Foreign key referencing the user. Required.
 * @property {string} userRef - Reference string for the user (3-50 chars). Required.
 * @property {string} firebaseId - Firebase authentication ID. Required.
 * @property {boolean} staff - Indicates if the user is a staff member. Default: false.
 * @property {string[]} permissions - Array of permission strings. Default: [].
 * @property {boolean} merchant - Indicates if the user is a merchant. Default: false.
 * @property {string[]} navbarPermissions - Array of navbar permission strings. Default: [].
 * @property {Date} createdAt - Timestamp of creation.
 * @property {Date} updatedAt - Timestamp of last update.
 * 
 * @class
 * @property {function} associate - Sets up model associations.
 * 
 * @schema
 * Table: user_roles
 * Columns:
 *   - id: INTEGER, PRIMARY KEY, AUTO_INCREMENT
 *   - user_id: INTEGER, NOT NULL
 *   - user_ref: STRING(3-50), NOT NULL
 *   - firebase_id: STRING, NOT NULL
 *   - staff: BOOLEAN, NOT NULL, DEFAULT FALSE
 *   - permissions: ARRAY of STRING, NULLABLE, DEFAULT []
 *   - merchant: BOOLEAN, NOT NULL, DEFAULT FALSE
 *   - navbar_permissions: ARRAY of STRING, NULLABLE, DEFAULT []
 *   - created_at: DATE, NOT NULL
 *   - updated_at: DATE, NOT NULL
 * Indexes:
 *   - firebase_id
 * 
 * Associations:
 *   - hasMany: Merchant (foreignKey: userRole, as: merchants)
 *   - hasMany: Staff (foreignKey: userRole, as: staffMembers)
 */
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
        allowNull: true,
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
        allowNull: true,
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
    indexes: [
        {
            fields: ['firebase_id']
        }
    ]
});

export default UserRole;