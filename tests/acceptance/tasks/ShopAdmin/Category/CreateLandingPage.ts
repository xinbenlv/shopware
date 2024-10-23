import { test as base } from '@playwright/test';
import type { FixtureTypes, Task } from '@fixtures/AcceptanceTest';

export const CreateLandingPage = base.extend<{ CreateLandingPage: Task }, FixtureTypes>({
    CreateLandingPage: async ({ ShopAdmin, AdminCategories, AdminLandingPageCreate, AdminLandingPageDetail, IdProvider }, use ) => {

        const landingPageData = {
            name: `Landing Page ${IdProvider.getIdPair().uuid}`,
            salesChannel: 'Storefront',
            seoUrl: `landing-${IdProvider.getIdPair().id}`,
        };
        const task = (layoutName: string, status: boolean) => {
            return async function CreateLandingPage() {

                await AdminCategories.landingPageHeadline.click();
                await AdminCategories.addLandingPageButton.click();

                await ShopAdmin.expects(AdminLandingPageDetail.saveLandingPageButton).toBeVisible();
                await ShopAdmin.expects(AdminLandingPageDetail.saveLandingPageButton).toContainText('Save');

                //Fill details and save
                await AdminLandingPageCreate.nameInput.fill(landingPageData.name);
                await AdminLandingPageCreate.landingPageStatus.setChecked(status);
                await AdminLandingPageCreate.salesChannelSelectionList.click();
                await AdminLandingPageCreate.filtersResultPopoverItemList.filter({ hasText: landingPageData.salesChannel }).click();
                await AdminLandingPageCreate.seoUrlInput.fill(landingPageData.seoUrl);

                if (layoutName) {
                    await AdminLandingPageCreate.layoutTab.click();
                    // Verify empty layout state
                    await ShopAdmin.expects(AdminLandingPageCreate.layoutEmptyState).toBeVisible();
                    await ShopAdmin.expects(AdminLandingPageCreate.createNewLayoutButton).toBeVisible();
                    // Select existing layout
                    await AdminLandingPageCreate.assignLayoutButton.click();
                    await AdminLandingPageCreate.loadingSpinner.waitFor({ state: 'hidden' });
                    await AdminLandingPageCreate.searchLayoutInput.dblclick();
                    // Search input need to delay press more than 300ms to mimic user typing in order to activate search action
                    await AdminLandingPageCreate.searchLayoutInput.pressSequentially(layoutName.split(' ')[1].substring(0,5), {delay: 500});
                    await AdminLandingPageCreate.layoutItems.first().waitFor({ state: 'visible' });
                    await AdminLandingPageCreate.layoutItems.first().click();
                    await AdminLandingPageCreate.layoutSaveButton.click();
                }
                await AdminLandingPageCreate.saveLandingPageButton.click();
                await AdminLandingPageCreate.loadingSpinner.waitFor({ state: 'hidden' });

                // Verify created landing page
                const createdLandingPage = AdminCategories.landingPageItems.locator(`text="${landingPageData.name}"`);
                await createdLandingPage.click();
                await AdminLandingPageDetail.loadingSpinner.waitFor({ state: 'hidden' });

                // Verify general tab detail
                await ShopAdmin.expects(AdminLandingPageDetail.nameInput).toHaveValue(landingPageData.name);
                await ShopAdmin.expects(AdminLandingPageDetail.landingPageStatus).toBeChecked();
                await ShopAdmin.expects(AdminLandingPageDetail.salesChannelSelectionList).toHaveText(landingPageData.salesChannel);
                await ShopAdmin.expects(AdminLandingPageDetail.seoUrlInput).toHaveValue(landingPageData.seoUrl);
                // Verify layout tab detail
                if (layoutName) {
                    await AdminLandingPageDetail.layoutTab.click();
                    await ShopAdmin.expects(AdminLandingPageDetail.layoutAssignmentCardTitle).toHaveText(layoutName);
                    await ShopAdmin.expects(AdminLandingPageDetail.layoutAssignmentCardHeadline).toHaveText(layoutName);

                    await ShopAdmin.expects(AdminLandingPageDetail.layoutAssignmentContentSection).toBeVisible();
                    await ShopAdmin.expects(AdminLandingPageDetail.layoutResetButton).toBeVisible();
                    await ShopAdmin.expects(AdminLandingPageDetail.changeLayoutButton).toBeVisible();
                    await ShopAdmin.expects(AdminLandingPageDetail.editInDesignerButton).toBeVisible();
                }
            }
        }

        await use(task);
    },
});
