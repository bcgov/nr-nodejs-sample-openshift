import type { FC } from 'react'
import type { AxiosResponse } from '~/axios'
import type { IntentionSearchResultDto } from '@/interfaces/IntentionDto'
import { useEffect, useState } from 'react'
import { Table, Alert } from 'react-bootstrap'
import apiService from '@/service/api-service'

const Dashboard: FC = () => {
  const [greeting, setGreeting] = useState<string>('')
  const [intention, setIntention] = useState<IntentionSearchResultDto | undefined>(undefined)
  const [intentionError, setIntentionError] = useState<boolean>(false)

  useEffect(() => {
    apiService
      .getAxiosInstance()
      .get('/')
      .then((response: AxiosResponse) => setGreeting(String(response.data)))
      .catch((error) => console.error(error))

    apiService
      .getAxiosInstance()
      .get('/v1/intention')
      .then((response?: AxiosResponse<IntentionSearchResultDto>) => {
        if (response?.data) setIntention(response.data)
        else setIntentionError(true)
      })
      .catch(() => setIntentionError(true))
  }, [])

  return (
    <div className="min-vh-45 mh-45 mw-75 ml-4">
      <h2>{greeting}</h2>
      <p>
        The backend logs in to Vault with the AppRole <code>role_id</code>/<code>secret_id</code>{' '}
        provisioned by the NR Broker cron job, reads the API token, and queries NR Broker. The token
        never leaves the backend.
      </p>

      <h3 className="mt-4">Latest Package Installation</h3>
      {intentionError && (
        <Alert variant="warning">Unable to load intention data from the API.</Alert>
      )}
      {intention && !intention.latest && (
        <Alert variant="info">
          No package-installation intentions found for <code>{intention.environment}</code>.
        </Alert>
      )}
      {intention?.latest && (
        <Table striped bordered hover>
          <tbody>
            {(
              [
                ['Intention ID', intention.latest.id],
                ['Project', intention.latest.project],
                ['Service', intention.latest.service],
                ['Environment', intention.latest.environment],
                ['Package', intention.latest.packageName],
                ['Version', intention.latest.packageVersion],
                ['Build Version', intention.latest.buildVersion],
                ['Outcome', intention.latest.outcome],
                ['Start', intention.latest.start],
                ['End', intention.latest.end],
                ['User', intention.latest.user],
                ['Reason', intention.latest.eventReason],
                ['Event URL', intention.latest.eventUrl],
              ] as const
            ).map(([label, value]) => (
              <tr key={label}>
                <th>{label}</th>
                <td>{value ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  )
}

export default Dashboard
