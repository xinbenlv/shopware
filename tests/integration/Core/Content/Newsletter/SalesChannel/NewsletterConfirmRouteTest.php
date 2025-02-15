<?php declare(strict_types=1);

namespace Shopware\Tests\Integration\Core\Content\Newsletter\SalesChannel;

use Doctrine\DBAL\Connection;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;
use Shopware\Core\Framework\Log\Package;
use Shopware\Core\Framework\Test\TestCaseBase\IntegrationTestBehaviour;
use Shopware\Core\Framework\Test\TestCaseBase\SalesChannelApiTestBehaviour;
use Shopware\Core\Test\Stub\Framework\IdsCollection;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;

/**
 * @internal
 */
#[Package('checkout')]
#[Group('store-api')]
class NewsletterConfirmRouteTest extends TestCase
{
    use IntegrationTestBehaviour;
    use SalesChannelApiTestBehaviour;

    private KernelBrowser $browser;

    private IdsCollection $ids;

    protected function setUp(): void
    {
        $this->ids = new IdsCollection();

        $this->browser = $this->createCustomSalesChannelBrowser([
            'id' => $this->ids->create('sales-channel'),
        ]);
    }

    public function testEmptyRequest(): void
    {
        $this->browser
            ->request(
                'POST',
                '/store-api/newsletter/confirm',
                [
                ]
            );

        $response = json_decode($this->browser->getResponse()->getContent() ?: '', true, 512, \JSON_THROW_ON_ERROR);

        static::assertSame('CONTENT__NEWSLETTER_RECIPIENT_NOT_FOUND', $response['errors'][0]['code']);
    }

    public function testWithInvalidHash(): void
    {
        $this->browser
            ->request(
                'POST',
                '/store-api/newsletter/confirm',
                [
                    'email' => 'test@test.de',
                    'hash' => 'foooo',
                ]
            );

        $response = json_decode($this->browser->getResponse()->getContent() ?: '', true, 512, \JSON_THROW_ON_ERROR);

        static::assertSame('CONTENT__NEWSLETTER_RECIPIENT_NOT_FOUND', $response['errors'][0]['code']);
    }

    public function testWithInvalidMail(): void
    {
        $this->browser
            ->request(
                'POST',
                '/store-api/newsletter/confirm',
                [
                    'email' => 'xxxxx@test.de',
                    'hash' => 'foooo',
                ]
            );

        $response = json_decode($this->browser->getResponse()->getContent() ?: '', true, 512, \JSON_THROW_ON_ERROR);

        static::assertSame('CONTENT__NEWSLETTER_RECIPIENT_NOT_FOUND', $response['errors'][0]['code']);
    }

    public function testConfirm(): void
    {
        $this->browser
            ->request(
                'POST',
                '/store-api/newsletter/subscribe',
                [
                    'email' => 'test@test.de',
                    'option' => 'subscribe',
                    'storefrontUrl' => 'http://localhost',
                ]
            );

        $count = (int) $this->getContainer()->get(Connection::class)->fetchOne('SELECT COUNT(*) FROM newsletter_recipient WHERE email = "test@test.de"');
        static::assertSame(1, $count);
        $hash = $this->getContainer()->get(Connection::class)->fetchOne('SELECT hash FROM newsletter_recipient WHERE email = "test@test.de"');

        $this->browser
            ->request(
                'POST',
                '/store-api/newsletter/confirm',
                [
                    'email' => 'test@test.de',
                    'hash' => $hash,
                ]
            );

        $status = $this->getContainer()->get(Connection::class)->fetchOne('SELECT status FROM newsletter_recipient WHERE email = "test@test.de"');
        static::assertSame('optIn', $status);
    }
}
