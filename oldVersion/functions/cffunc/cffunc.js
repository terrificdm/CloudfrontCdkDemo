// CF function example: redirect to different language website basing on "CloudFront-Viewer-Country" header
function handler(event) {
    var request = event.request;
    var headers = request.headers;
    var country = 'CN'; // Choose a country code
    var originurl = 'https://aws.amazon.com';
    var newurl = `https://aws.amazon.com/${country.toLowerCase()}/`; // Change the redirect URL to your choice

    if (headers['cloudfront-viewer-country']) {
        var countryCode = headers['cloudfront-viewer-country'].value;
        if (countryCode === country) {
            var response = {
                statusCode: 302,
                statusDescription: 'Found',
                headers:
                    { "location": { "value": newurl } }
                };
            return response;
        }
        // var response = {
        //     statusCode: 302,
        //     statusDescription: 'Found',
        //     headers:
        //         { "location": { "value": originurl } }
        //     }
        // return response;    
    }
    return request;
}