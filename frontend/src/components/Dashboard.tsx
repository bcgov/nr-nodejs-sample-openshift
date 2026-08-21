import type { FC } from 'react'
import type { AxiosResponse } from '~/axios'
import type { SecretsStatusDto } from '@/interfaces/SecretsDto'
import { useEffect, useState } from 'react'
import { Table, Alert, Badge } from 'react-bootstrap'
import apiService from '@/service/api-service'

const Dashboard: FC = () => {
    const [greeting, setGreeting] = useState<string>('')
    const [status, setStatus] = useState<SecretsStatusDto | undefined>(undefined)

    useEffect(() => {
        apiService
            .getAxiosInstance()
            .get('/')
            .then((response: AxiosResponse) => setGreeting(String(response.data)))
            .catch((error) => console.error(error))

        apiService
            .getAxiosInstance()
            .get('/v1/secrets')
            .then((response: AxiosResponse<SecretsStatusDto>) => setStatus(response.data))
            .catch((error) => console.error(error))
    }, [])

    return (
        <div className="min-vh-45 mh-45 mw-75 ml-4">
            <h2>{greeting}</h2>
            <p>
                Secrets below are rendered into the pod by the Vault Agent sidecar, which logs in with the
                AppRole <code>role_id</code>/<code>secret_id</code> provisioned by the NR Broker cron job.
                Only metadata is exposed &mdash; values never leave the pod.
            </p>

            {status && !status.available && (
                <Alert variant="warning">
                    No secrets rendered yet at <code>{status.file}</code>. Check the vault-agent sidecar logs.
                </Alert>
            )}

            {status?.available && (
                <>
                    <p>
                        <Badge bg="secondary">{status.vaultPath}</Badge>{' '}
                        <small>rendered at {status.renderedAt}</small>
                    </p>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>Secret Key</th>
                                <th>Value Length</th>
                                <th>Fingerprint (SHA-256)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {status.secrets.map((secret) => (
                                <tr key={secret.key}>
                                    <td>{secret.key}</td>
                                    <td>{secret.length}</td>
                                    <td>
                                        <code>{secret.fingerprint}</code>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </>
            )}
        </div>
    )
}

export default Dashboard
