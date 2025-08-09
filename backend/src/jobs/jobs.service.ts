import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateJobDto } from '../dto/create-job.dto';
import { Job, JobDocument, JobStatus } from '../schemas/job.schema';

@Injectable()
export class JobsService {
  constructor(
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
  ) {}

  async createJob(createJobDto: CreateJobDto, employerId: string) {
    const newJob = new this.jobModel({
      ...createJobDto,
      employerId,
      completionDeadline: new Date(createJobDto.completionDeadline),
    });

    const savedJob = await newJob.save() as JobDocument;
    return this.getJobById((savedJob._id as unknown as string).toString());
  }

  async getJobsByEmployer(employerId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const jobs = await this.jobModel
      .find({ employerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('employerId', 'firstName lastName email')
      .exec();

    const total = await this.jobModel.countDocuments({ employerId });

    return {
      jobs,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async getJobById(jobId: string) {
    const job = await this.jobModel
      .findById(jobId)
      .populate('employerId', 'firstName lastName email')
      .exec();

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async updateJob(jobId: string, updateData: Partial<CreateJobDto>, userId: string) {
    const job = await this.jobModel.findById(jobId);
    
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.employerId.toString() !== userId) {
      throw new ForbiddenException('You can only update your own jobs');
    }

    const updatedJob = await this.jobModel
      .findByIdAndUpdate(
        jobId,
        { 
          ...updateData,
          completionDeadline: updateData.completionDeadline ? new Date(updateData.completionDeadline) : job.completionDeadline
        },
        { new: true }
      )
      .populate('employerId', 'firstName lastName email')
      .exec();

    return updatedJob;
  }

  async deleteJob(jobId: string, userId: string) {
    const job = await this.jobModel.findById(jobId);
    
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.employerId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own jobs');
    }

    await this.jobModel.findByIdAndDelete(jobId);
    return { message: 'Job deleted successfully' };
  }

  async updateJobStatus(jobId: string, status: JobStatus, userId: string) {
    const job = await this.jobModel.findById(jobId);
    
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.employerId.toString() !== userId) {
      throw new ForbiddenException('You can only update your own jobs');
    }

    const updatedJob = await this.jobModel
      .findByIdAndUpdate(jobId, { status }, { new: true })
      .populate('employerId', 'firstName lastName email')
      .exec();

    return updatedJob;
  }

  async getActiveJobs(page: number = 1, limit: number = 10, category?: string, location?: string) {
    const skip = (page - 1) * limit;
    
    const filter: any = { 
      status: JobStatus.ACTIVE,
      isActive: true,
      completionDeadline: { $gte: new Date() }
    };

    if (category) {
      filter.category = category;
    }

    if (location) {
      filter.$or = [
        { location: { $regex: location, $options: 'i' } },
        { specificArea: { $regex: location, $options: 'i' } }
      ];
    }

    const jobs = await this.jobModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('employerId', 'firstName lastName')
      .exec();

    const total = await this.jobModel.countDocuments(filter);

    return {
      jobs,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }


}