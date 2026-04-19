export interface OrganizationEntity {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  registrationNumber?: string;
  representativeName?: string;
  businessName?: string;
  address?: string;
  businessType?: string;
  phoneNumber?: string;
  faxNumber?: string;
  depositAccount?: string;
  logoUrl?: string;
  userCount?: number;
  createdAt?: string;
  updatedAt?: string;
}
