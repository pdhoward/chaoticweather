
//Environments are either:
// 	1 - Bluemix Production
// 	2 - Bluemix Development
// 	3 - Localhost Development

var vcap_app = {application_uris: ['']};						//default blank
var ext_uri = '';
if(process.env.VCAP_APPLICATION){
	vcap_app = JSON.parse(process.env.VCAP_APPLICATION);
	for(var i in vcap_app.application_uris){
		if(vcap_app.application_uris[i].indexOf(vcap_app.name) >= 0){
			ext_uri = vcap_app.application_uris[i];
		}
	}
}
////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////    1. Bluemix Production    ////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
if(process.env.VCAP_APP_HOST && process.env.PRODUCTION){
	exports.SERVER = 	{
							HOST: process.env.VCAP_APP_HOST,
							PORT: process.env.VCAP_APP_PORT,
							DESCRIPTION: 'Bluemix - Production',
							EXTURI: ext_uri,
						};
}

////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////    2. Bluemix Development    ///////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
else if(process.env.VCAP_APP_HOST){
		exports.SERVER = 	{
								HOST: process.env.VCAP_APP_HOST,
								PORT: process.env.VCAP_APP_PORT,
								DESCRIPTION: 'Bluemix - Development',
								EXTURI: ext_uri,
							 };
}

////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////     3. Localhost - Development    ////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
else{
	exports.SERVER = 	{
							HOST:'localhost',
							PORT: 3000,
							DESCRIPTION: 'Localhost',
							EXTURI: 'localhost:3000',
						 };
}

exports.SERVER.vcap_app = vcap_app;
exports.SERVER.DB = 'mongodb://xio:cha0ticb0t@ds061676.mlab.com:61676/chaoticyo';

////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////     Common     ////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
exports.DEBUG = vcap_app;
