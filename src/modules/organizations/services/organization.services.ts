import Organization, { IOrganization } from '../models/organizations.model';

/**
 * Create a new organization
 * @param orgData Organization data
 * @returns Created organization
 */
export const createOrganization = async (orgData: Partial<IOrganization>): Promise<IOrganization> => {
  return await Organization.create(orgData);
};

/**
 * Get an organization by ID
 * @param id Organization ID
 * @returns Organization document
 */
export const getOrganizationById = async (id: string): Promise<IOrganization | null> => {
  return await Organization.findById(id);
};

/**
 * Get organizations with pagination
 * @param query Query parameters
 * @param page Page number
 * @param limit Items per page
 * @returns Organizations and pagination data
 */
export const getOrganizations = async (
  query: any = {},
  page: number = 1,
  limit: number = 10
): Promise<{ organizations: IOrganization[]; total: number; page: number; limit: number }> => {
  const skip = (page - 1) * limit;
  
  const organizations = await Organization.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  const total = await Organization.countDocuments(query);
  
  return {
    organizations,
    total,
    page,
    limit
  };
};

/**
 * Update an organization
 * @param id Organization ID
 * @param updateData Update data
 * @returns Updated organization
 */
export const updateOrganization = async (
  id: string,
  updateData: Partial<IOrganization>
): Promise<IOrganization | null> => {
  return await Organization.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });
};

/**
 * Delete an organization
 * @param id Organization ID
 * @returns Deleted organization
 */
export const deleteOrganization = async (id: string): Promise<IOrganization | null> => {
  return await Organization.findByIdAndDelete(id);
};

/**
 * Search organizations
 * @param keyword Search keyword
 * @returns Matching organizations
 */
export const searchOrganizations = async (keyword: string): Promise<IOrganization[]> => {
  const searchRegex = new RegExp(keyword, 'i');
  
  return await Organization.find({
    $or: [
      { name: searchRegex },
      { description: searchRegex },
      { industry: searchRegex }
    ]
  });
};