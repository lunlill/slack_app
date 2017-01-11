var request = require('request');
var path = require('path');
var accounts = require('../controllers/accounts.js');


module.exports = function(app){
	app.post('/lead/:id', function(req, res) {

		accounts.get_account_pw(req.params.id, function(account) {
			if(account == null) {
				return res.status(406).send('Not Acceptable');
			}

			let pw_header = {
				'Content-Type': 'application/json',
				'X-PW-AccessToken': account.pw_token,
				'X-PW-Application': 'developer_api',
				'X-PW-UserEmail': account.pw_email
			}

			let get_lead = {
				url: 'https://api.prosperworks.com/developer_api/v1/leads/' + req.body.ids[0],
				headers: pw_header
			};

			var count = 1;
			(function checkAssignee() {
				request(get_lead, function(error1, response1, body1) {
					console.log('Checking times:', count);
					let lead = JSON.parse(body1);

					if (!lead.id) {
						console.log('Error getting lead', JSON.stringify(error1));
						return res.status(404).send('Error');
					}

					else if (lead.assignee_id) {
						console.log('Found assignee!');

						var post_slack_body = {
							text: ':dart: A new lead has been created and no assignee.\n<https://app.prosperworks.com/companies/' + req.params.id + '/app?p=db#/lead/' + req.body.ids[0] + '|View this lead>',
							attachments: [
								{
									'color': '#3AA3E3',
									'fields': [
										{
											'title': 'Name',
											'value': '<https://app.prosperworks.com/companies/' + req.params.id + '/app?p=db#/lead/' + req.body.ids[0] + '|' + lead.name + '>',
											'short': false
										},
										{
											'title': 'Phone',
											'value': 'no phone number',
											'short': false
										},
										{
											'title': 'Email',
											'value': 'no email address',
											'short': false
										},
										{
											'title': 'Country',
											'value': 'no country',
											'short': false
										}
									]
								}
							]
						};
						if (lead.phone_numbers.length != 0) {
							post_slack_body.attachments[0].fields[1].value = lead.phone_numbers[0].number;
						}
						if (lead.email) {
							post_slack_body.attachments[0].fields[2].value = lead.email.email;
						}
						if (lead.address != null && lead.address.country) {
							post_slack_body.attachments[0].fields[3].value = lead.address.country;
						}

						let get_assignee = {
							url: 'https://api.prosperworks.com/developer_api/v1/users/' + lead.assignee_id,
							headers: pw_header
						};

						request(get_assignee, function(error2, response2, body2) {
							body2 = JSON.parse(body2);
							if (!body2.id) {
								console.log('Error getting assignee', JSON.stringify(body2));
							}
							else {
								let assignee_email = body2.email;

								let get_slack_users = {
									url: 'https://slack.com/api/users.list?token=' + account.slack_token
								};

								request(get_slack_users, function(error3, response3, body3) {
									body3 = JSON.parse(body3);
									if (!body3.ok) {
										console.log('Error getting slack users', JSON.stringify(body3));
									}
									else{
										let slack_users = body3.members;
										var slack_name = '';

										for (let user of slack_users) {
											if (user.is_bot) {
												continue;
											}
											else if (user.profile.email.toLowerCase() == assignee_email.toLowerCase()) {
												slack_name = user.name;
												break;
											}
										}

										if (slack_name != '') {
											post_slack_body.token = account.slack_token;
											post_slack_body.channel = '@' + slack_name;
											post_slack_body.text = post_slack_body.text.slice(0, 39) + 'assigned to you!' + post_slack_body.text.slice(51);
											post_slack_body.attachments = JSON.stringify(post_slack_body.attachments);

											var post_slack_options = {
												url: 'https://slack.com/api/chat.postMessage',
												headers: {'Content-Type': 'application/json'},
												qs: post_slack_body
											};

											request(post_slack_options, function(error4, response4, body4) {
												if (error4) {
													console.log('Error posting to slack', JSON.stringify(error4));
												}
												else {
													console.log('Posted to assignee');
													return res.json(req.body);
												}
											});
										}
										else {
											var post_slack_options = {
												url: account.slack_url,
												method: 'POST',
												headers: {
													'Content-Type': 'application/json'
												},
												json: true,
												body: post_slack_body
											};

											request(post_slack_options, function(error4, response4, body4) {
												if (error4) {
													console.log('Error posting to slack', JSON.stringify(error4));
												}
												else {
													console.log('Posted to channel');
													return res.json(req.body);
												}
											});
										}
									}
								});
							}
						});
					}

					else if (++count == 32) {
						console.log('10 mins time-out');

						var post_slack_body = {
							text: ':dart: A new lead has been created and no assignee.\n<https://app.prosperworks.com/companies/' + req.params.id + '/app?p=db#/lead/' + req.body.ids[0] + '|View this lead>',
							attachments: [
								{
									'color': '#3AA3E3',
									'fields': [
										{
											'title': 'Name',
											'value': '<https://app.prosperworks.com/companies/' + req.params.id + '/app?p=db#/lead/' + req.body.ids[0] + '|' + lead.name + '>',
											'short': false
										},
										{
											'title': 'Phone',
											'value': 'no phone number',
											'short': false
										},
										{
											'title': 'Email',
											'value': 'no email address',
											'short': false
										},
										{
											'title': 'Country',
											'value': 'no country',
											'short': false
										}
									]
								}
							]
						};
						if (lead.phone_numbers.length != 0) {
							post_slack_body.attachments[0].fields[1].value = lead.phone_numbers[0].number;
						}
						if (lead.email) {
							post_slack_body.attachments[0].fields[2].value = lead.email.email;
						}
						if (lead.address != null && lead.address.country) {
							post_slack_body.attachments[0].fields[3].value = lead.address.country;
						}

						var post_slack_options = {
							url: account.slack_url,
							method: 'POST',
							headers: {
								'Content-Type': 'application/json'
							},
							json: true,
							body: post_slack_body
						};

						request(post_slack_options, function(error4, response4, body4) {
							if (error4) {
								console.log('Error posting to slack', JSON.stringify(error4));
							}
							else {
								console.log('Posted to channel');
								return res.json(req.body);
							}
						});						
					}

					else {
						setTimeout(checkAssignee, 20 * 1000);
					}
				});
			})();

		});
	})

	app.post('/opportunity/:id', function(req, res) {

		accounts.get_account(req.params.id, function(account) {
			if(account == null) {
				return res.status(406).send('Not Acceptable');
			}

			let pw_header = {
				'Content-Type': 'application/json',
				'X-PW-AccessToken': account.pw_token,
				'X-PW-Application': 'developer_api',
				'X-PW-UserEmail': account.pw_email
			}

			let get_opportunity = {
				url: 'https://api.prosperworks.com/developer_api/v1/opportunities/' + req.body.ids[0],
				headers: pw_header
			};

			var count = 1;
			(function checkAssignee() {
				request(get_opportunity, function(error1, response1, body1) {
					console.log('Checking times:', count);
					let opportunity = JSON.parse(body1);

					if (!opportunity.id) {
						console.log('Error getting opportunity', JSON.stringify(error1));
						return res.status(404).send('Error');
					}

					else if (opportunity.assignee_id) {
						console.log('Found assignee!');

						let get_contact = {
							url: 'https://api.prosperworks.com/developer_api/v1/people/' + opportunity.primary_contact_id,
							headers: pw_header
						}

						request(get_contact, function(error2, response2, body2) {
							let contact = JSON.parse(body2);
							if (!contact.id) {
								console.log('Error getting contact', JSON.stringify(response2));
							}
							else {
								var post_slack_body = {
									text: ':dollar: A new opportunity has been created and no assignee.\n<https://app.prosperworks.com/companies/' + req.params.id + '/app?p=db#/deal/' + req.body.ids[0] + '|View this opportunity>',
									attachments: [
										{
											'color': '#3AA3E3',
											'fields': [
												{
													'title': 'Name',
													'value': '<https://app.prosperworks.com/companies/' + req.params.id + '/app?p=db#/deal/' + req.body.ids[0] + '|' + opportunity.name + '>',
													'short': false
												},
												{
													'title': 'Primary Contact',
													'value': '<https://app.prosperworks.com/companies/' + req.params.id + '/app?p=db#/contact/' + opportunity.primary_contact_id + '|' + contact.name + '>',
													'short': false
												},
												{
													'title': 'Value',
													'value': 'no value',
													'short': false
												},
												{
													'title': 'Pipeline',
													'value': 'no pipeline',
													'short': false
												},
												{
													'title': 'Source',
													'value': 'no source',
													'short': false
												}
											]
										}
									]
								};

								let get_pipeline = {
									url: 'https://api.prosperworks.com/developer_api/v1/pipelines',
									headers: pw_header
								}
								request(get_pipeline, function(error3, response3, body3) {
									for (let pipeline of JSON.parse(body3)) {
										if (pipeline.id == opportunity.pipeline_id) {
											post_slack_body.attachments[0].fields[3].value = pipeline.name;
											break;
										}
									}

									let get_source = {
										url: 'https://api.prosperworks.com/developer_api/v1/customer_sources',
										headers: pw_header
									}

									request(get_source, function(error4, response4, body4) {
										for (let source of JSON.parse(body4)) {
											if(source.id == opportunity.customer_source_id) {
												post_slack_body.attachments[0].fields[4].value = source.name;
												break;
											}
										}

										if (opportunity.monetary_value) {
											post_slack_body.attachments[0].fields[2].value = opportunity.monetary_value;
										}

										let get_assignee = {
											url: 'https://api.prosperworks.com/developer_api/v1/users/' + opportunity.assignee_id,
											headers: pw_header,
											method: 'GET'
										};

										request(get_assignee, function(error5, response5, body5) {
											body5 = JSON.parse(body5);
											if (!body5.id) {
												console.log('Error getting assignee', JSON.stringify(body5));
											}
											else {
												let assignee_email = body5.email;

												let get_slack_users = {
													url: 'https://slack.com/api/users.list?token=' + account.slack_token,
													method: 'GET',
												};

												request(get_slack_users, function(error6, response6, body6) {
													body6 = JSON.parse(body6);
													if (!body6.ok) {
														console.log('Error getting slack users', JSON.stringify(body6));
													}
													else{
														let slack_users = body6.members;
														var slack_name = '';

														for (let user of slack_users) {
															if (user.is_bot) {
																continue;
															}
															else if (user.profile.email.toLowerCase() == assignee_email.toLowerCase()) {
																slack_name = user.name;
																break;
															}
														}

														if (slack_name != '') {
															post_slack_body.token = account.slack_token;
															post_slack_body.channel = '@' + slack_name;
															post_slack_body.text = post_slack_body.text.slice(0, 48) + 'assigned to you!' + post_slack_body.text.slice(60);
															post_slack_body.attachments = JSON.stringify(post_slack_body.attachments);

															var post_slack_options = {
																url: 'https://slack.com/api/chat.postMessage',
																method: 'GET',
																headers: {'Content-Type': 'application/json'},
																qs: post_slack_body
															};

															request(post_slack_options, function(error7, response7, body7) {
																if (error7) {
																	console.log('Error posting to slack', JSON.stringify(error7));
																}
																else {
																	console.log('Posted to assignee');
																	return res.json(req.body);
																}
															});
														}
														else {
															var post_slack_options = {
																url: account.slack_url,
																method: 'POST',
																headers: {
																	'Content-Type': 'application/json'
																},
																json: true,
																body: post_slack_body
															};

															request(post_slack_options, function(error7, response7, body7) {
																if (error7) {
																	console.log('Error posting to slack', JSON.stringify(error7));
																}
																else {
																	console.log('Posted to channel');
																	return res.json(req.body);
																}
															});
														}
													}
												});
											}
										});
									});
								});	
							}
						});
					}

					else if (++count == 32) {
						console.log('10 mins time-out');

						let get_contact = {
							url: 'https://api.prosperworks.com/developer_api/v1/people/' + opportunity.primary_contact_id,
							headers: pw_header
						}

						request(get_contact, function(error2, response2, body2) {
							let contact = JSON.parse(body2);
							if (!contact.id) {
								console.log('Error getting contact', JSON.stringify(response2));
							}
							else {
								var post_slack_body = {
									text: ':dollar: A new opportunity has been created and no assignee.\n<https://app.prosperworks.com/companies/' + req.params.id + '/app?p=db#/deal/' + req.body.ids[0] + '|View this opportunity>',
									attachments: [
										{
											'color': '#3AA3E3',
											'fields': [
												{
													'title': 'Name',
													'value': '<https://app.prosperworks.com/companies/' + req.params.id + '/app?p=db#/deal/' + req.body.ids[0] + '|' + opportunity.name + '>',
													'short': false
												},
												{
													'title': 'Primary Contact',
													'value': '<https://app.prosperworks.com/companies/' + req.params.id + '/app?p=db#/contact/' + opportunity.primary_contact_id + '|' + contact.name + '>',
													'short': false
												},
												{
													'title': 'Value',
													'value': 'no value',
													'short': false
												},
												{
													'title': 'Pipeline',
													'value': 'no pipeline',
													'short': false
												},
												{
													'title': 'Source',
													'value': 'no source',
													'short': false
												}
											]
										}
									]
								};

								let get_pipeline = {
									url: 'https://api.prosperworks.com/developer_api/v1/pipelines',
									headers: pw_header
								}
								request(get_pipeline, function(error3, response3, body3) {
									for (let pipeline of JSON.parse(body3)) {
										if (pipeline.id == opportunity.pipeline_id) {
											post_slack_body.attachments[0].fields[3].value = pipeline.name;
											break;
										}
									}

									let get_source = {
										url: 'https://api.prosperworks.com/developer_api/v1/customer_sources',
										headers: pw_header
									}

									request(get_source, function(error4, response4, body4) {
										for (let source of JSON.parse(body4)) {
											if(source.id == opportunity.customer_source_id) {
												post_slack_body.attachments[0].fields[4].value = source.name;
												break;
											}
										}

										if (opportunity.monetary_value) {
											post_slack_body.attachments[0].fields[2].value = opportunity.monetary_value;
										}

										var post_slack_options = {
											url: account.slack_url,
											method: 'POST',
											headers: {
												'Content-Type': 'application/json'
											},
											json: true,
											body: post_slack_body
										};

										request(post_slack_options, function(error5, response5, body5) {
											if (error5) {
												console.log('Error posting to slack', JSON.stringify(error5));
											}
											else {
												console.log('Posted to channel');
												return res.json(req.body);
											}
										});
									});
								});	
							}
						});	
					}

					else {
						setTimeout(checkAssignee, 20 * 1000);
					}
				});
			})();
			
		});
	})

	app.post('/task/:id', function(req, res) {

		accounts.get_account(req.params.id, function(account) {
			if(account == null) {
				return res.status(406).send('Not Acceptable');
			}

			let pw_header = {
				'Content-Type': 'application/json',
				'X-PW-AccessToken': account.pw_token,
				'X-PW-Application': 'developer_api',
				'X-PW-UserEmail': account.pw_email
			}

			let get_task = {
				url: 'https://api.prosperworks.com/developer_api/v1/tasks/' + req.body.ids[0],
				headers: pw_header
			};
			

			var count = 1;
			(function checkAssignee() {
				request(get_task, function(error1, response1, body1) {
					console.log('Checking times:', count);
					let task = JSON.parse(body1);

					if (!task.id) {
						console.log('Error getting task', JSON.stringify(body1));
						return res.status(404).send('Error');
					}

					else if (task.assignee_id) {
						console.log('Found assignee!');

						var post_slack_body = {
							text: ':white_check_mark: A new task has been created and no assignee.\n<https://app.prosperworks.com/companies/' + req.params.id + '/app?p=db#/tasks/default/task/' + req.body.ids[0] + '|View this task>',
							attachments: [
								{
									'color': '#3AA3E3',
									'fields': [
										{
											'title': 'Name',
											'value': '<https://app.prosperworks.com/companies/' + req.params.id + '/app?p=db#/tasks/default/task/' + req.body.ids[0] + '|' + task.name + '>',
											'short': false
										},
										{
											'title': 'Due Date',
											'value': (new Date(task.due_date * 1000)).toLocaleString(),
											'short': false
										},
										{
											'title': 'Related to',
											'value': 'no relation',
											'short': false
										}
									]
								}
							]
						};

						if (task.related_resource.type) {
							var get_relation = {
								headers: pw_header
							};
							if (task.related_resource.type == 'lead') {
								get_relation.url = 'https://api.prosperworks.com/developer_api/v1/leads/' + task.related_resource.id;
							}
							else if (task.related_resource.type == 'person') {
								get_relation.url = 'https://api.prosperworks.com/developer_api/v1/people/' + task.related_resource.id;
							}
							else if (task.related_resource.type == 'company') {
								get_relation.url = 'https://api.prosperworks.com/developer_api/v1/companies/' + task.related_resource.id;
							}
							else if (task.related_resource.type == 'opportunity') {
								get_relation.url = 'https://api.prosperworks.com/developer_api/v1/opportunities/' + task.related_resource.id;
							}
							else if (task.related_resource.type == 'project') {
								get_relation.url = 'https://api.prosperworks.com/developer_api/v1/projects/' + task.related_resource.id;
							}

							request(get_relation, function(error2, response2, body2) {
								let relation = JSON.parse(body2);
								if (task.related_resource.type == 'lead') {
									post_slack_body.attachments[0].fields[2].value = '<https://app.prosperworks.com/companies/' + req.params.id + '/app?p=db#/lead/' + task.related_resource.id + '|' + relation.name + '>';
								}
								else if (task.related_resource.type == 'person') {
									post_slack_body.attachments[0].fields[2].value = '<https://app.prosperworks.com/companies/' + req.params.id + '/app?p=db#/contact/' + task.related_resource.id + '|' + relation.name + '>';
								}
								else if (task.related_resource.type == 'company') {
									post_slack_body.attachments[0].fields[2].value = '<https://app.prosperworks.com/companies/' + req.params.id + '/app?p=db#/organization/' + task.related_resource.id + '|' + relation.name + '>';
								}
								else if (task.related_resource.type == 'opportunity') {
									post_slack_body.attachments[0].fields[2].value = '<https://app.prosperworks.com/companies/' + req.params.id + '/app?p=db#/deal/' + task.related_resource.id + '|' + relation.name + '>';
								}
								else if (task.related_resource.type == 'project') {
									post_slack_body.attachments[0].fields[2].value = '<https://app.prosperworks.com/companies/' + req.params.id + '/app?p=db#/project/' + task.related_resource.id + '|' + relation.name + '>';
								}

								let get_assignee = {
									url: 'https://api.prosperworks.com/developer_api/v1/users/' + task.assignee_id,
									headers: pw_header
								};

								request(get_assignee, function(error3, response3, body3) {
									body3 = JSON.parse(body3);
									if (!body3.id) {
										console.log('Error getting assignee', JSON.stringify(response3));
									}
									else {
										let assignee_email = body3.email;

										let get_slack_users = {
											url: 'https://slack.com/api/users.list?token=' + account.slack_token
										};

										request(get_slack_users, function(error4, response4, body4) {
											body4 = JSON.parse(body4);
											if (!body4.ok) {
												console.log('Error getting slack users', JSON.stringify(response4));
											}
											else{
												let slack_users = body4.members;
												var slack_name = '';

												for (let user of slack_users) {
													if (user.is_bot) {
														continue;
													}
													else if (user.profile.email.toLowerCase() == assignee_email.toLowerCase()) {
														slack_name = user.name;
														break;
													}
												}

												if (slack_name != '') {
													post_slack_body.token = account.slack_token;
													post_slack_body.channel = '@' + slack_name;
													post_slack_body.text = post_slack_body.text.slice(0, 51) + 'assigned to you!' + post_slack_body.text.slice(63);
													post_slack_body.attachments = JSON.stringify(post_slack_body.attachments);

													var post_slack_options = {
														url: 'https://slack.com/api/chat.postMessage',
														headers: {'Content-Type': 'application/json'},
														qs: post_slack_body
													};

													request(post_slack_options, function(error5, response5, body5) {
														if (error5) {
															console.log('Error posting to slack', JSON.stringify(error5));
														}
														else {
															console.log('Posted to assignee');
															return res.json(req.body);
														}
													});
												}
												else {
													var post_slack_options = {
														url: account.slack_url,
														method: 'POST',
														headers: {
															'Content-Type': 'application/json'
														},
														json: true,
														body: post_slack_body
													};

													request(post_slack_options, function(error5, response5, body5) {
														if (error5) {
															console.log('Error posting to slack', JSON.stringify(error5));
														}
														else {
															console.log('Posted to channel');
															return res.json(req.body);
														}
													});
												}
											}
										});
									}
								});
							});
						}
						else {
							let get_assignee = {
								url: 'https://api.prosperworks.com/developer_api/v1/users/' + task.assignee_id,
								headers: pw_header
							};

							request(get_assignee, function(error2, response2, body2) {
								body2 = JSON.parse(body2);
								if (!body2.id) {
									console.log('Error getting assignee', JSON.stringify(body2));
								}
								else {
									let assignee_email = body2.email;

									let get_slack_users = {
										url: 'https://slack.com/api/users.list?token=' + account.slack_token
									};

									request(get_slack_users, function(error3, response3, body3) {
										body3 = JSON.parse(body3);
										if (!body3.ok) {
											console.log('Error getting slack users', JSON.stringify(body3));
										}
										else{
											let slack_users = body3.members;
											var slack_name = '';

											for (let user of slack_users) {
												if (user.is_bot) {
													continue;
												}
												else if (user.profile.email == assignee_email) {
													slack_name = user.name;
													break;
												}
											}

											if (slack_name != '') {
												post_slack_body.token = account.slack_token;
												post_slack_body.channel = '@' + slack_name;
												post_slack_body.attachments = JSON.stringify(post_slack_body.attachments);

												var post_slack_options = {
													url: 'https://slack.com/api/chat.postMessage',
													headers: {'Content-Type': 'application/json'},
													qs: post_slack_body
												};

												request(post_slack_options, function(error4, response4, body4) {
													if (error4) {
														console.log('Error posting to slack', JSON.stringify(error4));
													}
													else {
														console.log('Posted to assignee');
														return res.json(req.body);
													}
												});
											}
											else {
												var post_slack_options = {
													url: account.slack_url,
													method: 'POST',
													headers: {
														'Content-Type': 'application/json'
													},
													json: true,
													body: post_slack_body
												};

												request(post_slack_options, function(error4, response4, body4) {
													if (error4) {
														console.log('Error posting to slack', JSON.stringify(error4));
													}
													else {
														console.log('Posted to channel');
														return res.json(req.body);
													}
												});
											}
										}
									});
								}
							});
						}
					}

					else if (++count == 32) {
						console.log('10 mins time-out');

						var post_slack_body = {
							text: ':white_check_mark: A new task has been created and no assignee.\n<https://app.prosperworks.com/companies/' + req.params.id + '/app?p=db#/tasks/default/task/' + req.body.ids[0] + '|View this task>',
							attachments: [
								{
									'color': '#3AA3E3',
									'fields': [
										{
											'title': 'Name',
											'value': '<https://app.prosperworks.com/companies/' + req.params.id + '/app?p=db#/tasks/default/task/' + req.body.ids[0] + '|' + task.name + '>',
											'short': false
										},
										{
											'title': 'Due Date',
											'value': (new Date(task.due_date * 1000)).toLocaleString(),
											'short': false
										},
										{
											'title': 'Related to',
											'value': 'no relation',
											'short': false
										}
									]
								}
							]
						};

						if (task.related_resource.type) {
							var get_relation = {
								headers: pw_header
							};
							if (task.related_resource.type == 'lead') {
								get_relation.url = 'https://api.prosperworks.com/developer_api/v1/leads/' + task.related_resource.id;
							}
							else if (task.related_resource.type == 'person') {
								get_relation.url = 'https://api.prosperworks.com/developer_api/v1/people/' + task.related_resource.id;
							}
							else if (task.related_resource.type == 'company') {
								get_relation.url = 'https://api.prosperworks.com/developer_api/v1/companies/' + task.related_resource.id;
							}
							else if (task.related_resource.type == 'opportunity') {
								get_relation.url = 'https://api.prosperworks.com/developer_api/v1/opportunities/' + task.related_resource.id;
							}
							else if (task.related_resource.type == 'project') {
								get_relation.url = 'https://api.prosperworks.com/developer_api/v1/projects/' + task.related_resource.id;
							}

							request(get_relation, function(error2, response2, body2) {
								let relation = JSON.parse(body2);
								if (task.related_resource.type == 'lead') {
									post_slack_body.attachments[0].fields[2].value = '<https://app.prosperworks.com/companies/' + req.params.id + '/app?p=db#/lead/' + task.related_resource.id + '|' + relation.name + '>';
								}
								else if (task.related_resource.type == 'person') {
									post_slack_body.attachments[0].fields[2].value = '<https://app.prosperworks.com/companies/' + req.params.id + '/app?p=db#/contact/' + task.related_resource.id + '|' + relation.name + '>';
								}
								else if (task.related_resource.type == 'company') {
									post_slack_body.attachments[0].fields[2].value = '<https://app.prosperworks.com/companies/' + req.params.id + '/app?p=db#/organization/' + task.related_resource.id + '|' + relation.name + '>';
								}
								else if (task.related_resource.type == 'opportunity') {
									post_slack_body.attachments[0].fields[2].value = '<https://app.prosperworks.com/companies/' + req.params.id + '/app?p=db#/deal/' + task.related_resource.id + '|' + relation.name + '>';
								}
								else if (task.related_resource.type == 'project') {
									post_slack_body.attachments[0].fields[2].value = '<https://app.prosperworks.com/companies/' + req.params.id + '/app?p=db#/project/' + task.related_resource.id + '|' + relation.name + '>';
								}

								var post_slack_options = {
									url: account.slack_url,
									method: 'POST',
									headers: {
										'Content-Type': 'application/json'
									},
									json: true,
									body: post_slack_body
								};

								request(post_slack_options, function(error3, response3, body3) {
									if (error3) {
										console.log('Error posting to slack', JSON.stringify(error3));
									}
									else {
										console.log('Posted to channel');
										return res.json(req.body);
									}
								});

							});
						}

						else {
							var post_slack_options = {
								url: account.slack_url,
								method: 'POST',
								headers: {
									'Content-Type': 'application/json'
								},
								json: true,
								body: post_slack_body
							};

							request(post_slack_options, function(error2, response2, body2) {
								if (error2) {
									console.log('Error posting to slack', JSON.stringify(error2));
								}
								else {
									console.log('Posted to channel');
									return res.json(req.body);
								}
							});
						}
					}

					else {
						setTimeout(checkAssignee, 20 * 1000);
					}
				});
			})();

		});
	})

	app.post('/slack_commands/weather', function(req, res) {
		if(req.body.token != 'KQy2MBTwn08A00kw2KNbsWLT' && req.body.token != 'KQH210Te1KWcpl0o98idPLmk') {
			res.status(400).send('Bad Request');
		}
		else {
			let get_weather = {
				url: 'http://api.openweathermap.org/data/2.5/weather?APPID=083075e5e0b33c551dd50db5995c792d&zip=' + req.body.text.slice(0, 5) + ',us'
			};

			request(get_weather, function(err, response, body) {
				body = JSON.parse(body);
				if(body == undefined) {
					res.status(404).send('Weather info not found');
					return;
				}
				if(req.body.text.length == 5 || req.body.text.charAt(5).toLowerCase() == 'c')
					var weather_info = {
						"text": "It's " + String(Math.round(body.main.temp - 273.15)) + " degrees with " + body.weather[0].description + ".",
						"attachments": [
							{
								'color': '#3AA3E3',
								'fields': [
									{
										'title': 'Highest Temp',
										'value': String(Math.round(body.main.temp_max - 273.15)) + '°',
										'short': true
									},
									{
										'title': 'Lowest Temp',
										'value': String(Math.round(body.main.temp_min - 273.15)) + '°',
										'short': true
									},
									{
										'title': 'Humidity',
										'value': String(body.main.humidity) + "%",
										'short': true
									},
									{
										'title': 'Wind Speed',
										'value': String(body.wind.speed) + "MPH",
										'short': true
									}
								]
							}
						]
					}
				else {
					var weather_info = {
						"text": "It's " + String(Math.round(body.main.temp * 1.8 - 459.67)) + " degrees with " + body.weather[0].description + ".",
						"attachments": [
							{
								'color': '#3AA3E3',
								'fields': [
									{
										'title': 'Highest Temp',
										'value': String(Math.round(body.main.temp_max * 1.8 - 459.67)) + '°',
										'short': true
									},
									{
										'title': 'Lowest Temp',
										'value': String(Math.round(body.main.temp_min * 1.8 - 459.67)) + '°',
										'short': true
									},
									{
										'title': 'Humidity',
										'value': String(body.main.humidity) + "%",
										'short': true
									},
									{
										'title': 'Wind Speed',
										'value': String(body.wind.speed) + "MPH",
										'short': true
									}
								]
							}
						]
					}
				}
				
				res.status(200).json(weather_info);
			});
		}
	})

	app.post('/slack_commands/people', function(req, res) {
		if(req.body.token != 'KQH210Te1KWcpl0o98idPLmk') {
			res.status(400).send('Bad Request');
		}
		else {
			accounts.get_account_slack(req.body.team_id, function(account) {
				let pw_key = {
					'Content-Type': 'application/json',
					'X-PW-Application': 'developer_api',
					'X-PW-UserEmail': account.pw_email,
					'X-PW-AccessToken': account.pw_token
				}

				let people_query = {
					url: 'https://api.prosperworks.com/developer_api/v1/people/search',
					headers: pw_key,
					method: 'POST'
				}

				request(people_query, function(err, response, body) {
					console.log(body[0].name, req.body.text);
				});
			});
		}
	})
	

	app.post('/account_query', function(req, res) {
		let account_query = {
			url: 'https://api.prosperworks.com/developer_api/v1/account',
			headers: req.body,
			method: 'GET'
		};

		request(account_query, function(err, response, body) {
			res.json(body);
		});		
	})
	app.post('/subscribe_topics', function(req, res) {
		let subscribe = {
			url: 'https://api.prosperworks.com/developer_api/v1/webhooks/',
			headers: req.body.pw_key,
			method: 'POST',
			json: true,
			body: {
				event: 'new'
			}
		};
		var count = 0, subscribe_option = [], topics = [];

		for (var i = 0; i < req.body.topics.length; i++) {
			subscribe_option[i] = Object.create(subscribe);
			subscribe_option[i].body.target = 'https://prosperworks.herokuapp.com/' + req.body.topics[i] + '/' + String(req.body.account_id);
			subscribe_option[i].body.type = req.body.topics[i];

			request(subscribe_option[i], function(err, response, body) {
				if (err) {
					res.json('Error subscribing topics', response);
				}
				topics.push(body.id);
				if (++count == req.body.topics.length) {
					res.json(topics);
				}
			});	
		}
	})
	app.post('/unsubscribe_topics', function(req, res) {
		let unsubscribe = {
			headers: req.body.pw_key,
			method: 'DELETE'
		};
		var count = 0, unsubscribe_option = [];

		for (var i = 0; i < req.body.topics.length; i++) {
			unsubscribe_option[i] = Object.create(unsubscribe);
			unsubscribe_option[i].url = 'https://api.prosperworks.com/developer_api/v1/webhooks/' + String(req.body.topics[i]);

			request(unsubscribe_option[i], function(err, response, body) {
				if (err) {
					res.json('Error unsubscribing topics', response);
				}
				if (++count == req.body.topics.length) {
					res.json(body);
				}
			});	
		}
	})

	app.get('/api/app_info', function(req, res) {
		res.json({
			'client_id': process.env.client_id,
			'client_secret': process.env.client_secret
		});
	})
	app.post('/api/password', function(req, res) {
		var result = false;
		if(req.body.input == process.env.password) {
			result = true;
		}
		res.json({
			'res': result
		});
	})
	app.get('/api/accounts', function(req, res) {
		accounts.index(req, res);
	})
	app.get('/api/accounts/:id', function(req, res) {
		accounts.show(req, res);
	})
	app.post('/api/accounts', function(req, res) {
		accounts.create(req, res);
	})
	app.delete('/api/accounts/:id', function(req, res) {
		accounts.delete(req, res);
	})

	app.get('/*', function(req, res) {
		res.sendFile(path.join(__dirname, '../../client/index.html'));
	})
}