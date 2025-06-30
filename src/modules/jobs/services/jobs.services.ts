import Job, { IJob } from '../models/jobs.model';

/**
 * Create a new job
 * @param jobData Job data
 * @returns Created job
 */
export const createJob = async (jobData: Partial<IJob>): Promise<IJob> => {
    return await Job.create(jobData);
};

/**
 * Get a job by ID
 * @param id Job ID
 * @returns Job document
 */
export const getJobById = async (id: string): Promise<IJob | null> => {
    return await Job.findById(id)
        .populate('organizationId', 'name')
        .populate('concernId', 'name')
        .populate('departmentId', 'name')
        .populate('teamId', 'name')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');
};

/**
 * Get jobs with pagination
 * @param query Query parameters
 * @param page Page number
 * @param limit Items per page
 * @returns Jobs and pagination data
 */
export const getJobs = async (
    query: any = {},
    page: number = 1,
    limit: number = 10
): Promise<{ jobs: IJob[]; total: number; page: number; limit: number }> => {
    const skip = (page - 1) * limit;

    const jobs = await Job.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('organizationId', 'name')
        .populate('concernId', 'name')
        .populate('departmentId', 'name')
        .populate('teamId', 'name');

    const total = await Job.countDocuments(query);

    return {
        jobs,
        total,
        page,
        limit
    };
};

/**
 * Update a job
 * @param id Job ID
 * @param updateData Update data
 * @returns Updated job
 */
export const updateJob = async (
    id: string,
    updateData: Partial<IJob>
): Promise<IJob | null> => {
    return await Job.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
    });
};

/**
 * Delete a job
 * @param id Job ID
 * @returns Deleted job
 */
export const deleteJob = async (id: string): Promise<IJob | null> => {
    return await Job.findByIdAndDelete(id);
};

/**
 * Search jobs
 * @param keyword Search keyword
 * @returns Matching jobs
 */
export const searchJobs = async (keyword: string): Promise<IJob[]> => {
    return await Job.find({ $text: { $search: keyword } })
        .populate('organizationId', 'name')
        .populate('concernId', 'name')
        .populate('departmentId', 'name')
        .populate('teamId', 'name');
};

/**
 * Get jobs by organization ID
 * @param organizationId Organization ID
 * @returns Jobs belonging to the organization
 */
export const getJobsByOrganization = async (organizationId: string): Promise<IJob[]> => {
    return await Job.find({ organizationId })
        .populate('concernId', 'name')
        .populate('departmentId', 'name')
        .populate('teamId', 'name');
};

/**
 * Get jobs by concern ID
 * @param concernId Concern ID
 * @returns Jobs belonging to the concern
 */
export const getJobsByConcern = async (concernId: string): Promise<IJob[]> => {
    return await Job.find({ concernId })
        .populate('organizationId', 'name')
        .populate('departmentId', 'name')
        .populate('teamId', 'name');
};

/**
 * Get jobs by department ID
 * @param departmentId Department ID
 * @returns Jobs belonging to the department
 */
export const getJobsByDepartment = async (departmentId: string): Promise<IJob[]> => {
    return await Job.find({ departmentId })
        .populate('organizationId', 'name')
        .populate('concernId', 'name')
        .populate('teamId', 'name');
};

/**
 * Get jobs by team ID
 * @param teamId Team ID
 * @returns Jobs belonging to the team
 */
export const getJobsByTeam = async (teamId: string): Promise<IJob[]> => {
    return await Job.find({ teamId })
        .populate('organizationId', 'name')
        .populate('concernId', 'name')
        .populate('departmentId', 'name');
};

/**
 * Get jobs by employment type
 * @param employmentType Employment type
 * @returns Jobs with matching employment type
 */
export const getJobsByEmploymentType = async (employmentType: string): Promise<IJob[]> => {
    return await Job.find({ employmentType })
        .populate('organizationId', 'name')
        .populate('concernId', 'name')
        .populate('departmentId', 'name')
        .populate('teamId', 'name');
};

/**
 * Get active jobs
 * @returns Active jobs
 */
export const getActiveJobs = async (): Promise<IJob[]> => {
    return await Job.find({ isActive: true })
        .populate('organizationId', 'name')
        .populate('concernId', 'name')
        .populate('departmentId', 'name')
        .populate('teamId', 'name');
};