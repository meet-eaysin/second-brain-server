import mongoose, { Document, Schema } from 'mongoose';

export interface IJob extends Document {
    organizationId: mongoose.Schema.Types.ObjectId;
    concernId: mongoose.Schema.Types.ObjectId;
    departmentId: mongoose.Schema.Types.ObjectId;
    teamId: mongoose.Schema.Types.ObjectId;
    title: string;
    description: string;
    location: string;
    employmentType: string;
    salaryRange: string;
    qualifications: string[];
    responsibilities: string[];
    requirements: string[];
    benefits: string[];
    createdAt: Date;
    updatedAt: Date;
    createdBy: mongoose.Schema.Types.ObjectId;
    updatedBy: mongoose.Schema.Types.ObjectId;
    isActive: boolean;
}

const jobSchema = new Schema<IJob>({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organizations',
        required: true
    },
    concernId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'concerns',
        required: true
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'departments',
        required: true
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'teams',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    employmentType: {
        type: String,
        required: true,
        trim: true
    },
    salaryRange: {
        type: String,
        required: true,
        trim: true
    },
    qualifications: [{
        type: String,
        required: false
    }],
    responsibilities: [{
        type: String,
        required: false
    }],
    requirements: [{
        type: String,
        required: false
    }],
    benefits: [{
        type: String,
        required: false
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    isActive:{
      type:Boolean,
      default:true
  }
});

jobSchema.pre<IJob>('save', function (next) {
    this.updatedAt = new Date();
    next();
});

jobSchema.index({ organizationId: 1, concernId: 1, departmentId: 1, teamId: 1, title: 1 });

const JobModel = mongoose.model<IJob>('jobs', jobSchema);

export default JobModel;