import Teams, {ITeam} from "../models/teams.moodel";

/**
 * Create a new team
 * @param teamData Team data
 * @returns Created team
 */
export const createTeam = async (teamData: Partial<ITeam>): Promise<ITeam> => {
    return await Teams.create(teamData);
};

/**
 * Get a team by ID
 * @param id Team ID
 * @returns Team document
 */
export const getTeamById = async (id: string): Promise<ITeam | null> => {
    return await Teams.findById(id)
        .populate('organizationId', 'name')
        .populate('concernId', 'name')
        .populate('departmentId', 'name')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');
};

/**
 * Get teams with pagination
 * @param query Query parameters
 * @param page Page number
 * @param limit Items per page
 * @returns Teams and pagination data
 */
export const getTeams = async (
    query: any = {},
    page: number = 1,
    limit: number = 10
): Promise<{ teams: ITeam[]; total: number; page: number; limit: number }> => {
    const skip = (page - 1) * limit;

    const teams = await Teams.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('organizationId', 'name')
        .populate('concernId', 'name')
        .populate('departmentId', 'name');

    const total = await Teams.countDocuments(query);

    return {
        teams,
        total,
        page,
        limit
    };
};

/**
 * Update a team
 * @param id Team ID
 * @param updateData Update data
 * @returns Updated team
 */
export const updateTeam = async (
    id: string,
    updateData: Partial<ITeam>
): Promise<ITeam | null> => {
    return await Teams.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
    });
};

/**
 * Delete a team
 * @param id Team ID
 * @returns Deleted team
 */
export const deleteTeam = async (id: string): Promise<ITeam | null> => {
    return await Teams.findByIdAndDelete(id);
};

/**
 * Search teams
 * @param keyword Search keyword
 * @returns Matching teams
 */
export const searchTeams = async (keyword: string): Promise<ITeam[]> => {
    const searchRegex = new RegExp(keyword, 'i');

    return await Teams.find({
        $or: [
            { name: searchRegex },
            { description: searchRegex }
        ]
    }).populate('organizationId', 'name')
        .populate('concernId', 'name')
        .populate('departmentId', 'name');
};

/**
 * Get teams by organization ID
 * @param organizationId Organization ID
 * @returns Teams belonging to the organization
 */
export const getTeamsByOrganization = async (organizationId: string): Promise<ITeam[]> => {
    return await Teams.find({ organizationId })
        .populate('concernId', 'name')
        .populate('departmentId', 'name');
};

/**
 * Get teams by concern ID
 * @param concernId Concern ID
 * @returns Teams belonging to the concern
 */
export const getTeamsByConcern = async (concernId: string): Promise<ITeam[]> => {
    return await Teams.find({ concernId })
        .populate('organizationId', 'name')
        .populate('departmentId', 'name');
};

/**
 * Get teams by department ID
 * @param departmentId Department ID
 * @returns Teams belonging to the department
 */
export const getTeamsByDepartment = async (departmentId: string): Promise<ITeam[]> => {
    return await Teams.find({ departmentId })
        .populate('organizationId', 'name')
        .populate('concernId', 'name');
};