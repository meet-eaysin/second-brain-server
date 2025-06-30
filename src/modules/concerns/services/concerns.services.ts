import Concerns, {IConcern} from "../models/concerns.model";

/**
 * Create a new concern
 * @param concernData Concern data
 * @returns Created concern
 */
export const createConcern = async (concernData: Partial<IConcern>): Promise<IConcern> => {
    console.log("calling service")
    return await Concerns.create(concernData);
};

/**
 * Get a concern by ID
 * @param id Concern ID
 * @returns Concern document
 */
export const getConcernById = async (id: string): Promise<IConcern | null> => {
    return await Concerns.findById(id)
        .populate('organizationId', 'name')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .populate('adminId', 'name email');
};

/**
 * Get concerns with pagination
 * @param query Query parameters
 * @param page Page number
 * @param limit Items per page
 * @returns Concerns and pagination data
 */
export const getConcerns = async (
    query: any = {},
    page: number = 1,
    limit: number = 10
): Promise<{ concerns: IConcern[]; total: number; page: number; limit: number }> => {
    const skip = (page - 1) * limit;

    const concerns = await Concerns.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('organizationId', 'name')
        .populate('adminId', 'name email');

    const total = await Concerns.countDocuments(query);

    return {
        concerns,
        total,
        page,
        limit
    };
};

/**
 * Update a concern
 * @param id Concern ID
 * @param updateData Update data
 * @returns Updated concern
 */
export const updateConcern = async (
    id: string,
    updateData: Partial<IConcern>
): Promise<IConcern | null> => {
    return await Concerns.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
    });
};

/**
 * Delete a concern
 * @param id Concern ID
 * @returns Deleted concern
 */
export const deleteConcern = async (id: string): Promise<IConcern | null> => {
    return await Concerns.findByIdAndDelete(id);
};

/**
 * Search concerns
 * @param keyword Search keyword
 * @returns Matching concerns
 */
export const searchConcerns = async (keyword: string): Promise<IConcern[]> => {
    const searchRegex = new RegExp(keyword, 'i');

    return await Concerns.find({
        $or: [
            { name: searchRegex },
            { description: searchRegex },
            { industry: searchRegex },
            { address: searchRegex },
            { city: searchRegex }
        ]
    }).populate('organizationId', 'name');
};

/**
 * Get concerns by organization ID
 * @param organizationId Organization ID
 * @returns Concerns belonging to the organization
 */
export const getConcernsByOrganization = async (organizationId: string): Promise<IConcern[]> => {
    return await Concerns.find({ organizationId })
        .populate('adminId', 'name email');
};