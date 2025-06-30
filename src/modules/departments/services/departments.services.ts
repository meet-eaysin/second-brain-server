import Department, { IDepartment } from '../models/departments.model';

/**
 * Create a new department
 * @param departmentData Department data
 * @returns Created department
 */
export const createDepartment = async (departmentData: Partial<IDepartment>): Promise<IDepartment> => {
    return await Department.create(departmentData);
};

/**
 * Get a department by ID
 * @param id Department ID
 * @returns Department document
 */
export const getDepartmentById = async (id: string): Promise<IDepartment | null> => {
    return await Department.findById(id)
        .populate('organizationId', 'name')
        .populate('concernId', 'name')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');
};

/**
 * Get departments with pagination
 * @param query Query parameters
 * @param page Page number
 * @param limit Items per page
 * @returns Departments and pagination data
 */
export const getDepartments = async (
    query: any = {},
    page: number = 1,
    limit: number = 10
): Promise<{ departments: IDepartment[]; total: number; page: number; limit: number }> => {
    const skip = (page - 1) * limit;

    const departments = await Department.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('organizationId', 'name')
        .populate('concernId', 'name');

    const total = await Department.countDocuments(query);

    return {
        departments,
        total,
        page,
        limit
    };
};

/**
 * Update a department
 * @param id Department ID
 * @param updateData Update data
 * @returns Updated department
 */
export const updateDepartment = async (
    id: string,
    updateData: Partial<IDepartment>
): Promise<IDepartment | null> => {
    return await Department.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
    });
};

/**
 * Delete a department
 * @param id Department ID
 * @returns Deleted department
 */
export const deleteDepartment = async (id: string): Promise<IDepartment | null> => {
    return await Department.findByIdAndDelete(id);
};

/**
 * Search departments
 * @param keyword Search keyword
 * @returns Matching departments
 */
export const searchDepartments = async (keyword: string): Promise<IDepartment[]> => {
    const searchRegex = new RegExp(keyword, 'i');

    return await Department.find({
        $or: [
            { name: searchRegex },
            { description: searchRegex }
        ]
    }).populate('organizationId', 'name')
        .populate('concernId', 'name');
};

/**
 * Get departments by organization ID
 * @param organizationId Organization ID
 * @returns Departments belonging to the organization
 */
export const getDepartmentsByOrganization = async (organizationId: string): Promise<IDepartment[]> => {
    return await Department.find({ organizationId })
        .populate('concernId', 'name');
};

/**
 * Get departments by concern ID
 * @param concernId Concern ID
 * @returns Departments belonging to the concern
 */
export const getDepartmentsByConcern = async (concernId: string): Promise<IDepartment[]> => {
    return await Department.find({ concernId })
        .populate('organizationId', 'name');
};