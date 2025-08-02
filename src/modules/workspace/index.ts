// Routes
export { default as workspaceRoutes } from './routes/workspace.routes';

// Controllers
export {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceMembers,
  addWorkspaceMember,
  removeWorkspaceMember,
  updateMemberRole,
  getWorkspacePermissions,
  getWorkspaceStats,
  leaveWorkspace,
  getPublicWorkspaces,
  searchWorkspaces,
  getWorkspaceActivity,
  duplicateWorkspace
} from './controllers/workspace.controller';

// Services
export {
  createWorkspace as createWorkspaceService,
  getWorkspaceById as getWorkspaceByIdService,
  getUserWorkspaces as getUserWorkspacesService,
  updateWorkspace as updateWorkspaceService,
  deleteWorkspace as deleteWorkspaceService,
  addWorkspaceMember as addWorkspaceMemberService,
  removeWorkspaceMember as removeWorkspaceMemberService,
  updateMemberRole as updateMemberRoleService,
  getWorkspaceMembers as getWorkspaceMembersService,
  getWorkspacePermissions as getWorkspacePermissionsService,
  getWorkspaceStats as getWorkspaceStatsService,
  toWorkspaceInterface
} from './services/workspace.service';

// Models
export { WorkspaceModel, IWorkspace, IWorkspaceDocument } from './models/workspace.model';

// Types
export type {
  IWorkspace,
  IWorkspaceDocument,
  IWorkspaceMember,
  TWorkspaceRole,
  TWorkspacePermission,
  TWorkspaceCreateRequest,
  TWorkspaceUpdateRequest,
  TWorkspaceInviteRequest,
  TWorkspaceMemberUpdateRequest,
  TGetWorkspacesQuery,
  TGetWorkspaceMembersQuery,
  TWorkspaceListResponse,
  TWorkspaceMemberResponse,
  TWorkspaceMembersListResponse,
  TWorkspaceStatsResponse,
  TWorkspaceInvitation,
  TWorkspaceInvitationCreateRequest,
  TWorkspaceActivity,
  TWorkspacePermissions,
  TWorkspaceSettings,
  TWorkspaceError,
  WorkspaceDocument
} from './types/workspace.types';

// Validators
export {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  workspaceIdSchema,
  memberIdSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  getWorkspacesQuerySchema,
  getWorkspaceMembersQuerySchema,
  updateWorkspaceSettingsSchema,
  transferOwnershipSchema,
  bulkMemberOperationSchema,
  searchWorkspacesSchema,
  workspaceValidators
} from './validators/workspace.validators';
