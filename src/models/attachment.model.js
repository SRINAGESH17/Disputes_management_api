
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.config.js';

class Attachment extends Model {
    // static associate(models) {}
    static associate(models) {

        Attachment.belongsTo(models.Business, {
            foreignKey: 'businessId',
            as: 'merchant'
        });

        Attachment.belongsTo(models.Dispute, {
            foreignKey: 'disputeId',
            as: 'dispute'
        });
    }

}

Attachment.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    merchantId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'merchants',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    },
    businessId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'businesses',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    },
    disputeId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'disputes',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    },
    customDisputeId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    userUploadedId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    userUploadedRef: {
        type: DataTypes.ENUM('ANALYST', 'MERCHANT'),
        allowNull: false,
    },
    fileName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    url: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    sizeType: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    size: {
        type: DataTypes.DECIMAL,
        allowNull: false,
    },
    isLatest: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    format: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    stage: {
        type: DataTypes.ENUM('PENDING', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'RESUBMITTED'),
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'Attachment',
    tableName: 'attachments',
    timestamps: true,
    indexes: [
        {
            fields: ['merchant_id']
        },
        {
            fields: ['business_id']
        },
        {
            fields: ['dispute_id']
        },
        {
            fields: ['custom_dispute_id']
        },
        {
            fields: ['created_at']
        },
        {
            fields: ['business_id', 'custom_dispute_id', 'created_at']
        }
    ]
});


// Note 
// For Indexes
// 1.business_id,custom_dispute_id,created_at ==> .business_id,custom_dispute_id,updated_At
// 2.business_id,analyst_id, dispute_id


export default Attachment;